import rasterio
from rasterio.transform import from_origin
import numpy as np

# Create a synthetic 4-band Sentinel-2 image (64x64 pixels)
# Bands: B2 (Blue), B3 (Green), B4 (Red), B8 (NIR)
np.random.seed(42)
height, width = 64, 64
num_bands = 4

# Create synthetic surface reflectance values in Sentinel-2 scale (0 to ~3000)
data = np.zeros((num_bands, height, width), dtype=np.float32)

# B2 - Blue (e.g. water / urban features)
data[0] = np.random.randint(200, 1000, (height, width)).astype(np.float32)
# B3 - Green (vegetation)
data[1] = np.random.randint(400, 1500, (height, width)).astype(np.float32)
# B4 - Red (vegetation absorption)
data[2] = np.random.randint(300, 1200, (height, width)).astype(np.float32)
# B8 - NIR (high vegetation response)
data[3] = np.random.randint(1500, 3000, (height, width)).astype(np.float32)

# Create spatial pattern (synthetic river/road and vegetation field)
for y in range(height):
    for x in range(width):
        if (x - y) ** 2 < 25: # Diagonal feature
            data[0, y, x] = 1800  # High blue/water
            data[3, y, x] = 200   # Low NIR
        elif x > 30 and y > 30: # High vegetation patch
            data[1, y, x] = 1200
            data[3, y, x] = 2800  # High NIR

# Geospatial metadata (e.g., somewhere over land)
transform = from_origin(77.2090, 28.6139, 0.0001, 0.0001)

profile = {
    'driver': 'GTiff',
    'height': height,
    'width': width,
    'count': num_bands,
    'dtype': 'float32',
    'crs': 'EPSG:4326',
    'transform': transform,
}

output_filename = 'sample_sentinel2_4band.tif'
with rasterio.open(output_filename, 'w', **profile) as dst:
    dst.write(data)

print(f"Successfully generated {output_filename} ({width}x{height}, 4 bands)")
