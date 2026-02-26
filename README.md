# Overview
In this project a comprehensive scRNA-seq analysis of the stepwise progression of HNSCC — from normal tissue through leukoplakia, primary cancer, to lymph node metastasis — using publicly available data from GEO (GSE181919).

# Trying to answer
1. How does the immune microenvironment change from normal tissue → leukoplakia → primary cancer → metastasis?
2. What is the difference in T cell exhaustion between HPV+ and HPV– tumors?

# Dataset Information
GSE181919 comprises 37 tissue specimens collected from 23 HNSCC patients, spanning four stages of disease progression: 9 normal tissue samples (NL, 16,420 cells), 4 leukoplakia samples (LP, 6,527 cells), 20 primary HNSCC tumors (CA, 23,088 cells), and 4 metastatic lymph node samples (LN, 8,204 cells), totalling 54,239 cells. Samples were collected from three anatomical subsites — oral cavity (OC, 24,156 cells), oropharynx (OP, 26,427 cells), and hypopharynx (HP, 3,656 cells). Among the primary cancer samples, 32,292 cells were from HPV– patients and 21,947 from HPV+ patients.

Ten major cell types were annotated across the dataset: T cells, Fibroblasts, Malignant cells, B/Plasma cells, Macrophages, Endothelial cells, Dendritic cells, Epithelial cells, Myocytes and Mast cells.


# Analysis Pipeline
# Step 1 — Data Acquisition
Raw data was downloaded manually from GEO database:
1. GSE181919_UMI_counts.txt.gz - contains the full gene × cell UMI count matrix (20,000 genes × 54,239 cells), and 
2. GSE181919_Barcode_metadata.txt.gz - contains 8 cell-level metadata columns: patient.id (23 patients), sample.id (37 samples), Gender, Age, tissue.type (NL/LP/CA/LN), subsite (OC/OP/HP), hpv (HPV+/HPV–), and cell.type (10 annotated types).


# Step 2 — Seurat Object Creation (01_GSE181919_Creating_Seurat_Object.Rmd)
a) Loaded UMI count matrix (20,000 genes × 54,239 cells)
b) Fixed cell barcode format mismatch (.(dot) → -(hypen))
c) Filtered to 15,086 protein-coding genes (removed 4,914 non-coding)

Applied quality thresholds:
a) min.cells = 3 — genes detected in at least 3 cells
b) min.features = 200 — cells with at least 200 genes detected

Final Seurat object contains 54,236 cells × 15,086 genes.
Added all 8 metadata columns (tissue.type, hpv, cell.type, etc.).
Output: 01_GSE181919_seurat_raw.rds


# Step 3 — Quality Control & Batch Correction (02_GSE181919_QC_BatchCorrection.Rmd)
# QC Filtering:
Four sequential filters were applied to remove low-quality cells from the raw Seurat object. 
a) Cells were filtered by gene count, requiring a minimum of 200 genes (to remove empty droplets) and a maximum of 8,000 genes (to remove likely doublets) — notably, no cells were removed by either threshold, suggesting the authors had already performed basic QC before depositing to GEO. 

b) Cells with mitochondrial gene content exceeding 15% were removed as markers of dying or stressed cells, eliminating 43 cells. 

c) A Mahalanobis distance-based filter was applied to remove the worst 5% of statistical outliers by total UMI count, removing 2,344 cells. 

d) Ribosomal gene filtering, commonly applied in non-tumor datasets, was intentionally skipped — HNSCC tumor cells including malignant epithelial cells, fibroblasts, and immune cells naturally express high levels of ribosomal genes due to active protein synthesis, and applying a standard 10% threshold would have removed over 97% of cells. 

After all filters, 51,849 cells were retained, representing a 95.6% retention rate, confirming the high quality of this dataset.

Note on ribosomal filtering: HNSCC tumor cells (malignant epithelial, fibroblasts, immune cells) naturally express high levels of ribosomal genes due to active protein synthesis. Applying a standard 10% ribosomal threshold would remove >97% of cells. This filter is therefore intentionally skipped for this cancer dataset.

# Normalization & Dimensionality Reduction:
a) LogNormalize normalization (scale factor = 10,000)
b) 2,500 highly variable genes selected (VST method)
c) PCA computed (100 PCs)
d) 50 PCs selected based on elbow plot analysis (explains 89.3% of variance)
e) UMAP computed on PCA embeddings → 33 clusters (unintegrated)

# Batch Correction (Harmony):
a) Batch variable: patient.id (23 patients — true source of technical variation)
b) Harmony corrected UMAP → 30 clusters (integrated)
c) Same-batch fraction reduced from 0.470 → 0.247 (47.4% reduction)
d) All 23 patients show improved mixing after correction

# Plots Generated:
# Quality Control (GSE181919_Quality Control.pdf)
a) Pre-QC and Post-QC violin plots for nCount_RNA, nFeature_RNA, percent.mt and percent.rb — distributions shown per sample, colored by tissue type (NL/LP/CA/LN)
b) Pre-QC and Post-QC density scatter plots of log1p(nCount_RNA) vs log1p(nFeature_RNA) colored by tissue type, with marginal histograms

# Dimensionality Reduction (GSE181919_ElbowPlot.pdf)
a) PCA elbow plot showing variance explained per PC — used to select 50 PCs (89.3% variance)

# Batch Correction (GSE181919_Batch Correction.pdf)
a) UMAP plots before and after Harmony correction, colored by tissue type and by patient ID — visually confirms batch effect removal
b) KNN batch mixing bar plot comparing same-batch fraction per patient before vs after Harmony — quantifies the 47.4% reduction in batch effect

