"""
Complete Multi-Class Accuracy Test for All 5 Classes
"""
from ultralytics import YOLO
import os
from pathlib import Path
from collections import defaultdict

# Load model
model = YOLO('rooster_multiclass_injury_model.pt')
print(f"Model classes: {model.names}")

# Validation directory
val_dir = Path('dataset/injury_detection_multiclass_split/val')

# Test each class
results_by_class = {}
confusion_matrix = defaultdict(lambda: defaultdict(int))
all_predictions = []

for class_name in ['healthy', 'bumblefoot', 'wing_injury', 'feather_loss', 'comb_injury']:
    class_dir = val_dir / class_name
    
    if not class_dir.exists():
        print(f"⚠️  {class_name} directory not found")
        continue
    
    images = list(class_dir.glob('*.jpg')) + list(class_dir.glob('*.png')) + list(class_dir.glob('*.jpeg'))
    
    if len(images) == 0:
        print(f"⚠️  No images found in {class_name}")
        continue
    
    print(f"\n📁 Testing {class_name}: {len(images)} images")
    
    correct = 0
    confidences = []
    
    for img_path in images:
        # Run prediction
        result = model(str(img_path), verbose=False)[0]
        
        # Get prediction
        pred_idx = result.probs.top1
        pred_name = model.names[pred_idx]
        confidence = float(result.probs.top1conf.item())
        
        confidences.append(confidence)
        confusion_matrix[class_name][pred_name] += 1
        
        if pred_name == class_name:
            correct += 1
        else:
            print(f"   ❌ Misclassified: {img_path.name} -> predicted as {pred_name} (conf: {confidence:.3f})")
    
    accuracy = correct / len(images) if len(images) > 0 else 0
    avg_conf = sum(confidences) / len(confidences) if confidences else 0
    
    results_by_class[class_name] = {
        'total': len(images),
        'correct': correct,
        'accuracy': accuracy,
        'avg_confidence': avg_conf
    }
    
    print(f"   ✅ Accuracy: {accuracy*100:.1f}% ({correct}/{len(images)})")
    print(f"   📊 Avg Confidence: {avg_conf:.3f}")

# Overall statistics
print("\n" + "="*70)
print("COMPLETE RESULTS - ALL 5 CLASSES")
print("="*70)

total_images = sum(r['total'] for r in results_by_class.values())
total_correct = sum(r['correct'] for r in results_by_class.values())
overall_accuracy = total_correct / total_images if total_images > 0 else 0

print(f"\n📊 OVERALL ACCURACY: {overall_accuracy*100:.1f}% ({total_correct}/{total_images})")

print("\n📈 PER-CLASS RESULTS:")
print("-" * 70)
print(f"{'Class':<20} {'Total':<8} {'Correct':<8} {'Accuracy':<12} {'Avg Conf':<10}")
print("-" * 70)

for class_name in ['healthy', 'bumblefoot', 'wing_injury', 'feather_loss', 'comb_injury']:
    if class_name in results_by_class:
        r = results_by_class[class_name]
        print(f"{class_name:<20} {r['total']:<8} {r['correct']:<8} {r['accuracy']*100:>6.1f}%      {r['avg_confidence']:>6.3f}")
    else:
        print(f"{class_name:<20} {'N/A':<8} {'N/A':<8} {'N/A':<12} {'N/A':<10}")

print("\n📊 CONFUSION MATRIX:")
print("-" * 70)
classes = ['healthy', 'bumblefoot', 'wing_injury', 'feather_loss', 'comb_injury']
print(f"{'True \\ Pred':<20}", end='')
for c in classes:
    print(f"{c[:8]:<10}", end='')
print()
print("-" * 70)

for true_class in classes:
    print(f"{true_class:<20}", end='')
    for pred_class in classes:
        count = confusion_matrix[true_class][pred_class]
        print(f"{count:<10}", end='')
    print()

print("\n" + "="*70)
print("✅ TESTING COMPLETE!")
print("="*70)
