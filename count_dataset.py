"""Count all dataset images"""
from pathlib import Path

print("="*70)
print("INJURY CLASSIFICATION DATASET")
print("="*70)

base = Path('dataset/injury_detection_multiclass_split')
classes = ['healthy', 'bumblefoot', 'wing_injury', 'feather_loss', 'comb_injury']

train_total = 0
val_total = 0

print("\nTRAINING SET:")
for c in classes:
    train_dir = base / 'train' / c
    if train_dir.exists():
        count = len([f for f in train_dir.iterdir() if f.is_file()])
        train_total += count
        print(f"  {c:<20} {count:>5} images")
    else:
        print(f"  {c:<20} NOT FOUND")

print(f"\n  {'TRAIN TOTAL:':<20} {train_total:>5} images")

print("\nVALIDATION SET:")
for c in classes:
    val_dir = base / 'val' / c
    if val_dir.exists():
        count = len([f for f in val_dir.iterdir() if f.is_file()])
        val_total += count
        print(f"  {c:<20} {count:>5} images")
    else:
        print(f"  {c:<20} NOT FOUND")

print(f"\n  {'VAL TOTAL:':<20} {val_total:>5} images")

injury_total = train_total + val_total
print(f"\n  {'GRAND TOTAL:':<20} {injury_total:>5} images")

print("\n" + "="*70)
print("POSE DETECTION DATASET")
print("="*70)

pose_base = Path('dataset/yolo_rooster_dataset')
train_dir = pose_base / 'train' / 'images'
val_dir = pose_base / 'val' / 'images'

train_count = len([f for f in train_dir.iterdir() if f.is_file()]) if train_dir.exists() else 0
val_count = len([f for f in val_dir.iterdir() if f.is_file()]) if val_dir.exists() else 0

print(f"\n  Training:   {train_count:>5} images")
print(f"  Validation: {val_count:>5} images")
print(f"  TOTAL:      {train_count + val_count:>5} images")

print("\n" + "="*70)
print("SUMMARY")
print("="*70)
print(f"\n  Pose Detection Dataset:     {train_count + val_count:>5} images (17 keypoints)")
print(f"  Injury Classification:      {injury_total:>5} images (5 classes)")
print(f"\n  COMBINED TOTAL:             {train_count + val_count + injury_total:>5} images")
print("\n" + "="*70)
