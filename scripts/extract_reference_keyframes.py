import cv2
import os

video_path = "reference-video.mp4"
output_dir = "artifacts/reference-analysis/reference-keyframes"
os.makedirs(output_dir, exist_ok=True)

cap = cv2.VideoCapture(video_path)
if not cap.isOpened():
    print(f"Error opening video {video_path}")
    exit(1)

fps = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
duration = total_frames / fps
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

print(f"Video Info: {width}x{height}, FPS: {fps}, Total Frames: {total_frames}, Duration: {duration:.2f}s")

# Sample keyframes at key intervals across the video
# Let's extract 12 evenly spaced keyframes or at every 1-2 seconds
timestamps = [0.5, 1.5, 3.0, 5.0, 7.0, 9.0, 11.0, 13.0, 15.0, 18.0, 21.0, 24.0]

for i, t in enumerate(timestamps):
    if t > duration:
        continue
    frame_no = int(t * fps)
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_no)
    ret, frame = cap.read()
    if not ret:
        continue
    
    # Save raw frame
    raw_path = os.path.join(output_dir, f"frame_{i:02d}_raw_{t:.1f}s.png")
    cv2.imwrite(raw_path, frame)
    
    # Also save rotated 90 deg clockwise (landscape orientation)
    rot_cw = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
    cw_path = os.path.join(output_dir, f"frame_{i:02d}_rot_cw_{t:.1f}s.png")
    cv2.imwrite(cw_path, rot_cw)

    # Also save rotated 90 deg counter-clockwise
    rot_ccw = cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)
    ccw_path = os.path.join(output_dir, f"frame_{i:02d}_rot_ccw_{t:.1f}s.png")
    cv2.imwrite(ccw_path, rot_ccw)

cap.release()
print("Keyframes extracted successfully.")
