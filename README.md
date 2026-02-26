# Overview
In this project a comprehensive scRNA-seq analysis of the stepwise progression of HNSCC — from normal tissue through leukoplakia, primary cancer, to lymph node metastasis — using publicly available data from GEO (GSE181919).

# Trying to answer
1. How does the immune microenvironment change from normal tissue → leukoplakia → primary cancer → metastasis?
2. What is the difference in T cell exhaustion between HPV+ and HPV– tumors?

# Dataset Information
GSE181919 comprises 37 tissue specimens collected from 23 HNSCC patients, spanning four stages of disease progression: 9 normal tissue samples (NL, 16,420 cells), 4 leukoplakia samples (LP, 6,527 cells), 20 primary HNSCC tumors (CA, 23,088 cells), and 4 metastatic lymph node samples (LN, 8,204 cells), totalling 54,239 cells. Samples were collected from three anatomical subsites — oral cavity (OC, 24,156 cells), oropharynx (OP, 26,427 cells), and hypopharynx (HP, 3,656 cells). Among the primary cancer samples, 32,292 cells were from HPV– patients and 21,947 from HPV+ patients.

Ten major cell types were annotated across the dataset: T cells, Fibroblasts, Malignant cells, B/Plasma cells, Macrophages, Endothelial cells, Dendritic cells, Epithelial cells, Myocytes and Mast cells.

Raw data was downloaded manually from GEO database:
1. GSE181919_UMI_counts.txt.gz - contains the full gene × cell UMI count matrix (20,000 genes × 54,239 cells), and 
2. GSE181919_Barcode_metadata.txt.gz - contains 8 cell-level metadata columns: patient.id (23 patients), sample.id (37 samples), Gender, Age, tissue.type (NL/LP/CA/LN), subsite (OC/OP/HP), hpv (HPV+/HPV–), and cell.type (10 annotated types).

# Analysis Pipeline
# Step 1 — Data Acquisition
Raw data was downloaded manually from GEO database:
1. GSE181919_UMI_counts.txt.gz - contains the full gene × cell UMI count matrix (20,000 genes × 54,239 cells), and 
2. GSE181919_Barcode_metadata.txt.gz - contains 8 cell-level metadata columns: patient.id (23 patients), sample.id (37 samples), Gender, Age, tissue.type (NL/LP/CA/LN), subsite (OC/OP/HP), hpv (HPV+/HPV–), and cell.type (10 annotated types).

# Step 2 — Seurat Object Creation (01_GSE181919_Creating_Seurat_Object.Rmd)
Loaded UMI count matrix (20,000 genes × 54,239 cells)
Fixed cell barcode format mismatch (.(dot) → -(hypen))
Filtered to 15,086 protein-coding genes (removed 4,914 non-coding)

Applied quality thresholds:
min.cells = 3 — genes detected in at least 3 cells
min.features = 200 — cells with at least 200 genes detected


Final Seurat object: 54,236 cells × 15,086 genes
Added all 8 metadata columns (tissue.type, hpv, cell.type, etc.)
Output: 01_GSE181919_seurat_raw.rds

