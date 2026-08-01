# Recommended Agricultural Datasets for KrishiSahay

Here are some high-quality, open-access datasets you can use to train your AI model. Download the CSV/JSON files and place them in the `data/` folder.

## 1. Crop Production & Statistics
*   **India Agriculture Crop Production (Kaggle)**
    *   **Link**: [Kaggle - Crop Production in India](https://www.kaggle.com/datasets/abhinand05/crop-production-in-india)
    *   **Description**: Contains state-wise, district-wise crop yield data for various seasons.
    *   **Usage**: Great for predicting yield or recommending crops based on region.

## 2. Pests & Diseases
*   **PlantVillage Dataset (Kaggle)**
    *   **Link**: [Kaggle - PlantVillage Dataset](https://www.kaggle.com/datasets/arjuntejaswi/plant-village)
    *   **Description**: 54,000+ images of healthy and diseased plant leaves.
    *   **Usage**: **Note:** This is an image dataset. For text RAG, look for descriptions of these diseases or use a CSV version if available.
*   **Pest Classification Dataset**
    *   **Link**: [Kaggle - Pest Dataset](https://www.kaggle.com/datasets/vbookshelf/rice-leaf-diseases) (Example for Rice)

## 3. Soil & Weather
*   **Indian Soil Types**
    *   **Source**: [Kaggle - Soil Types](https://www.kaggle.com/search?q=indian+soil+dataset)
    *   **Usage**: Soil-based crop recommendations.
*   **Historical Weather Data**
    *   **Link**: [Visual Crossing / NOAA](https://www.visualcrossing.com/) (Has free tiers)

## 4. Government Schemes (Official Sources)
*   **Vikaspedia Agriculture**
    *   **Link**: [Vikaspedia - Agriculture](https://vikaspedia.in/agriculture)
    *   **Usage**: Best source for text data on schemes. You can copy-paste scheme details into `data/schemes/schemes.json`.

## Instructions for Use
1.  **Download** the dataset (CSV preferred for text RAG).
2.  **Clean** the data (removes empty rows, unnecessary columns).
3.  **Place** it in a folder inside `data/` (e.g., `data/crops/new_crop_data.csv`).
4.  **Update** `backend/rag.py` to load this new file in the `load_data` function.
