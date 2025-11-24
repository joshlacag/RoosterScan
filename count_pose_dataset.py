"""Count pose detection dataset"""
from pathlib import Path

base = Path('yolo_rooster_dataset')
dirs = ['train/images', 'train/labels', 'val/images', 'val/labels']

print("="*70)
print("POSE DETECTION DATASET (yolo_rooster_dataset)")
print("="*70)

for d in dirs:
    p = base / d
    if p.exists():
        count = len([f for f in p.iterdir() if f.is_file()])
        print(f"  {d:<20} {count:>5} files")
    else:
        print(f"  {d:<20} NOT FOUND")

# Calculate totals
train_img = base / 'train/images'
val_img = base / 'val/images'

train_count = len([f for f in train_img.iterdir() if f.is_file()]) if train_img.exists() else 0
val_count = len([f for f in val_img.iterdir() if f.is_file()]) if val_img.exists() else 0

print(f"\n  {'Training images:':<20} {train_count:>5}")
print(f"  {'Validation images:':<20} {val_count:>5}")
print(f"  {'TOTAL:':<20} {train_count + val_count:>5}")
print("="*70)
