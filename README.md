# Overview
In this project, a comprehensive scRNA-seq analysis of the stepwise progression of HNSCC — from normal tissue through leukoplakia, primary cancer, to lymph node metastasis — using publicly available data from GEO (GSE181919).

# Trying to answer
1. How does the immune microenvironment change from normal tissue → leukoplakia → primary cancer → metastasis?
2. What is the difference in T cell exhaustion between HPV+ and HPV– tumors?

# Dataset Information
GSE181919 comprises 37 tissue specimens collected from 23 HNSCC patients, spanning four stages of disease progression: 9 normal tissue samples (NL, 16,420 cells), 4 leukoplakia samples (LP, 6,527 cells), 20 primary HNSCC tumors (CA, 23,088 cells), and 4 metastatic lymph node samples (LN, 8,204 cells), totalling 54,239 cells. Samples were collected from three anatomical subsites — oral cavity (OC, 24,156 cells), oropharynx (OP, 26,427 cells), and hypopharynx (HP, 3,656 cells). Among the primary cancer samples, 32,292 cells were from HPV– patients and 21,947 from HPV+ patients.

Ten major cell types were annotated across the dataset: T cells, Fibroblasts, Malignant cells, B/Plasma cells, Macrophages, Endothelial cells, Dendritic cells, Epithelial cells, Myocytes and Mast cells.

# Analysis Pipeline
**Step 1** — Data Acquisition
**Step 2** — Seurat Object Creation (01_GSE181919_Creating_Seurat_Object.Rmd)
**Step 3** — Quality Control & Batch Correction (02_GSE181919_QC_BatchCorrection.Rmd) 
Plots:Quality Control (GSE181919_Quality Control.pdf), Dimensionality Reduction (GSE181919_ElbowPlot.pdf), Batch Correction (GSE181919_Batch Correction.pdf)
**Step 4** — CellTypist Cell Type Annotation (03_GSE181919_CellTypist_Annotation.Rmd)
Plots:(GSE181919_UMAP_CellTypist_labels_and_Author_vs_Celltypist_Annotation.pdf)
**Step 5** — Tumor Microenvironment Analysis (04_GSE181919_TME_Analysis.Rmd)
Plots:(GSE181919_TME_Anlaysis_plots.pdf)
**Step 6** — T Cell Exhaustion Analysis (05_GSE181919_T_Cell_Exhaustion_Analysis.Rmd)
Plots:(GSE181919_T_Cell_Exhaustion_Analysis.pdf)
**Step 7** — Differential Expression Analysis (06_GSE181919_DifferentialExpression.Rmd)
Plots:(GSE181919_DEG_Analysis.pdf)
**Step 8** — Cell-Cell Communication Analysis (07_GSE181919_CellChat_Cell-Cell_Communication_Analysis.Rmd)
Plots:(GSE181919_CellChat.pdf)
**Step 9** — Pseudotime Trajectory Analysis (08_GSE181919_Trajectory_Analysis_Monocle3.Rmd)
Plots:(GSE181919_Trajectory_plots.pdf)

# Key Findings
**TME Remodelling Across Disease Progression**
i) The dominant transition in HNSCC is a stromal-to-immune shift: Fibroblasts collapse from 52% → 2% and T cells expand from 25% → 57% across NL → LN
ii) The immune compartment grows from 33% (NL) → 95% (LN); stromal compartment collapses from 67% → 2%
iii) B/Plasma cells expand steadily from 5% (NL) → 26% (LN), driven by CXCL13-mediated tertiary lymphoid structure (TLS) formation
iv) CXCL13 is the top upregulated gene in both Tcells and Fibroblasts (NL vs CA) — exhausted Tcells and cancer-associated fibroblasts converge on the same TLS-recruiting signal

**HPV+ vs HPV– TME**
i) HPV+ tumors are Tcell-rich (50%) — strong adaptive immune response driven by viral antigens
ii) HPV– tumors are Macrophage-rich (21%) and Fibroblast-rich (14%) — innate immune suppression and desmoplastic stroma dominate
iii) HPV+ upregulates heat shock proteins (HSPA1A, DNAJB1) — viral proteotoxic stress
iv) HPV– upregulates inflammatory chemokines (CXCL3, CXCL8, CXCL2) — broader but less antigen-specific inflammation

**Cell-Cell Communication**
i) NL → CA: interactions increase 3.1× (688 → 2,123); maintained through LN (1,731)
ii) CAF broadcasting: Fibroblasts send COLLAGEN/LAMININ/TGFb/VEGF to all cell types simultaneously — invasion scaffold + immunosuppression
iii) Primary exhaustion axis: LGALS9 → HAVCR2 (Galectin-9 → TIM-3) from Dendritic cells
iv) HPV immune evasion: HPV+ suppresses MHC-II signalling (DCs → CD4+ T cells) — absent in HPV–

**Tcell Exhaustion Trajectory**
i) Exhaustion program (Module 1) increases 3× from NL → LN (2.44 → 7.42), confirmed independently by UCell scoring, CellChat pathways, and Monocle3 trajectory
ii) TIGIT is the only monotonically increasing checkpoint along pseudotime — the primary progressive therapeutic target
iii) Progenitor_Tex cells are actively cycling — stem-like pool maintains proliferative capacity during exhaustion transition
iv) Treg activation is a late/terminal event (FOXP3 rises at pseudotime > 3, CA/LN specific) — immunosuppression is acquired, not pre-existing

# Answers to Biological Questions
**Q1: How does the immune microenvironment change across disease progression?**
The HNSCC TME undergoes a progressive stromal collapse and immune invasion from NL → LN. Normal tissue is fibroblast-dominated (52%) with a modest Tcell presence (25%). As disease advances, cancer-associated fibroblasts are replaced by immune infiltrates — Tcells, macrophages, and B/Plasma cells. By the lymph node stage, the TME is 95% immune cells. This is not a simple expansion: each immune cell type is transcriptionally reprogrammed. Macrophages are the most extensively rewired cell type, receiving signals from every other cell type (CellChat) and reaching the highest pseudotime values of any cell. The pre-malignant LP stage shows a paradoxically high stromal field effect, suggesting maximal stromal remodelling precedes — and may drive — tumour establishment. The CA → LN transition shows remarkably few new changes (~30 DEGs per cell type), indicating the immune programme established in the primary tumour is fully exported to the metastatic lymph node.

**Q2: What is the difference in Tcell exhaustion between HPV+ and HPV– tumors?**
HPV+ and HPV– tumours drive fundamentally different but equally dysfunctional exhaustion programmes. HPV– Tcells score higher on exhaustion by UCell metrics, but their exhaustion is broad and unorganised whic is driven by inflammatory chemokines and macrophage-mediated suppression. HPV+ Tcells show a deeper but more organised exhaustion: 2× more HAVCR2 (TIM-3) and 50% more CXCL13 along the pseudotime trajectory, with HPV+ cells preferentially routing toward the terminal exhaustion arm. Despite deeper exhaustion, HPV+ tumours have better prognosis — explained by elevated CXCL13 driving stronger TLS formation, creating local sites for Tcell reactivation. HPV+ immune evasion is selective (MHC-II suppression targeting CD4+ Tcells), while HPV– evasion is broad (Galectin-9/TIM-3 and CTLA4 pathways active across all Tcells). TIGIT is the dominant progressive checkpoint in both groups — the only marker continuously increasing from naïve to terminal exhaustion.

# Software
Package - Version- Use
Seurat - 5.x- Core scRNA-seq framework
Harmony - 1.x - Batch correction
CellTypist - 1.x - Cell type annotation
UCell - 2.x - Gene set scoring
DESeq2 - 1.x - Differential expression
CellChat - ≥2.1.0 - Cell-cell communication
monocle3  1.4.26 - Trajectory analysis
SeuratWrappers - 0.4.0 - Seurat→Monocle3 conversion
R - 4.5 - Analysis environment



**For detailed methodology, statistical definitions, and step-by-step rationale refer GSE181919_Methods_Report.pdf and GSE181919_ReadMe.txt**
