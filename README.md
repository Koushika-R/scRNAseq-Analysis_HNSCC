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


# Step 4 — CellTypist Cell Type Annotation (03_GSE181919_CellTypist_Annotation.Rmd)
# Model Selection:
CellTypist was run using the Immune_All_High.pkl model — trained on immune and stromal populations from 20 human tissues. This model was selected over Human_Colorectal_Cancer.pkl because it directly covers 8/10 GSE181919 cell types. The two cell types not in the model were handled as follows: malignant cells were predicted as Epithelial cells (biologically correct — HNSCC malignant cells are of epithelial origin), and myocytes (only 282 cells, 0.5% of dataset) were assigned to the nearest available label.

# Annotation Approach:
a) CellTypist was run via the reticulate R package, calling Python directly from R to avoid memory issues encountered in standalone Python (51,849 cells × 15,086 genes exceeded available RAM during the scaling step). 
b) Per-cell prediction was used (majority_voting = FALSE) as the neighbor graph computation required for majority voting also crashed on 16 GB RAM.

# Validation Against Author Labels:
CellTypist annotation using the Immune_All_High model showed strong agreement with the author-provided cell type labels across all major populations. The highest agreement was observed for Mast cells (98.1%), plasmacytoid Dendritic cells (97.9%), Plasma cells (95.7%), Fibroblasts (94.6%), and T cells (94.3%), all exceeding 94% concordance. Macrophages (92.4%), B cells (90.3%), and Endothelial cells (89.6%) also showed excellent agreement. Notably, Malignant cells were predicted as Epithelial cells with 83.3% agreement — this is biologically expected rather than a misclassification, as HNSCC malignant cells are of epithelial origin and the model does not contain a dedicated malignant cell category. Overall, CellTypist correctly identified 8 out of 10 cell types with greater than 89% accuracy, confirming the reliability of the automated annotation for this dataset.

# Plots (GSE181919_UMAP_CellTypist_labels_and_Author_vs_Celltypist_Annotation.pdf)
a) CellTypist predicted labels on Harmony UMAP — confirms clean cell type separation matching author annotations
b) CellTypist labels split by tissue type (NL/LP/CA/LN) — shows cell type composition changes across disease progression
c) CellTypist vs Author annotation confusion matrix heatmap — quantifies agreement between predicted and published labels


# Step 5 — Tumor Microenvironment Analysis (04_GSE181919_TME_Analysis.Rmd)
# Cell Type Proportions Across Disease Progression (NL → LP → CA → LN):
a) The dominant transition in HNSCC progression is a stromal-to-immune shift. 
b) Fibroblasts decrease from 52% in NL to 2% in LN, while T cells increase from 25% in NL to 57% in LN. 
c) B/Plasma cells show a steady increase across all stages (5% → 15% → 18% → 26%), reflecting progressive humoral immune activation. 
d) Macrophages peak at CA (15%), consistent with tumor-associated macrophage infiltration. Malignant cells are entirely absent in NL and LP and appear exclusively in CA (17%) and minimally in LN (3%).


# TME Compartment Ratios:
Stage → Immune | Stromal | Malignant
a) NL → 33%    |  67%    |  0%
b) LP → 45%    |  55%    |  0%
c) CA → 74%    |  10%    |  16%
d) LN → 95%    |   2%    |  3%

The immune compartment expands progressively from 33% in normal tissue to 95% in lymph node metastasis. The stromal compartment collapses from 67% to 2% as cancer-associated fibroblasts are replaced by immune infiltrates. Malignant cells peak at CA (16%) and are nearly absent in LN (3%), indicating that metastatic spread involves few tumor cells relative to the immune response they trigger.


# HPV Status Shapes the TME:
a) HPV+ and HPV– tumors show fundamentally different TME compositions. HPV+ tumors are T cell-rich (50% vs 27% in HPV–), reflecting the strong adaptive immune response driven by viral antigens. 
b) HPV– tumors are macrophage-rich (21% vs 5%) and fibroblast-rich (14% vs 1%), suggesting innate immune suppression and desmoplastic stroma dominate in HPV– HNSCC. 
c) Malignant cells are more abundant in HPV+ tumors (23% vs 11%), consistent with HPV oncoprotein-driven cell proliferation. 

# Plots Generated: (GSE181919_TME_Anlaysis_plots.pdf)
a) Cell type proportions by tissue type — stacked and grouped bar plots
b) Cell type proportions by HPV status — stacked and grouped bar plots (CA only)
c) TME compartment ratios (Immune/Stromal/Malignant) — stacked and grouped bar plots
d) CellTypist subtype proportions by tissue type — stacked bar plot with 15 subtypes
e) Canonical marker gene dot plot — 40 genes across 10 cell types


# Step 6 — T Cell Exhaustion Analysis (05_GSE181919_T_Cell_Exhaustion_Analysis.Rmd)
# TCell Subclustering:
Tcells (17,533 cells) were subset from the full annotated object and re-clustered independently, yielding 19 subclusters at resolution 0.5. Re-clustering within Tcells reveals fine-grained heterogeneity invisible in the full dataset — including CD8+ cytotoxic, CD4+ helper, Treg, proliferating (MKI67+), and rare NKT-like populations. NL Tcells concentrate in the upper UMAP region while CA Tcells dominate the central and lower body. HPV+ Tcells enrich the right arm (largest cluster 0), consistent with viral antigen-driven cytotoxic expansion.

# UCell State Scoring:
Five Tcell functional states were scored per cell using UCell rank-based module scoring, which is robust to differences in cell number and expression scale. Signatures used: Exhausted (PDCD1, HAVCR2, LAG3, TIGIT, CTLA4), Effector (GZMB, PRF1, IFNG, TNF, GZMA), Naive/Memory (TCF7, CCR7, SELL, LEF1, IL7R), Treg (FOXP3, IL2RA, IKZF2, CTLA4, TNFRSF18), and Progenitor_Tex (TCF7, PDCD1, SLAMF6, CXCR5, TOX). All five states were validated by canonical marker gene dot plot.

# HPV+ vs HPV– T Cell States (CA only):
All five state comparisons were statistically significant (Wilcoxon test, p < 0.0001 for 4/5 states):

State| Direction| Biological Meaning| 
Effector| Higher in HPV– |HPV– T cells retain cytotoxic capacity
Exhausted| Higher in HPV– |HPV– TME drives deeper T cell exhaustion
Naive_Memory| Higher in HPV+| HPV+ T cells are more stem-like and less exhausted
Progenitor_Tex| Higher in HPV–| More stem-like exhausted T cells in HPV– tumors
Treg| Higher in HPV–| Stronger immunosuppression in HPV– tumors

# T Cell States Across Disease Progression:
Exhaustion scores increase progressively from NL → LP → CA → LN. Tregs accumulate at LP/CA and decline at LN. Naive/Memory T cells decrease as disease progresses. Effector T cells peak at LN, consistent with lymph node being an active immune activation site. NL and LP show bimodal score distributions reflecting heterogeneous early T cell states, while CA and LN show unimodal rightward shifts indicating homogeneous late-stage exhaustion.

# Plots Generated (GSE181919_T_Cell_Exhaustion_Analysis.pdf)
a) T cell subclusters, tissue type, and HPV status UMAPs (3 plots)
b) Feature plots for 13 exhaustion/effector/Treg genes
c) UCell state scores on UMAP (5 scores)
d) Violin plots — HPV+ vs HPV– with Wilcoxon p-values
e) Ridge plots — state score distributions across NL/LP/CA/LN
f) T cell states on UMAP
g) State proportions by HPV status and tissue type (2 bar plots)
h) Exhaustion marker dot plot per T cell state


# Step 7 — Differential Expression Analysis (06_GSE181919_DifferentialExpression.Rmd)
# Cell Type Marker Genes: 
9,206 marker genes identified across 10 cell types. All cell types show clean, biologically specific markers: Malignant cells (KRT6A/KRT6B), B/Plasma cells (JCHAIN/MZB1/CD79A), Macrophages (FCN1/C1QC/CD163), Fibroblasts (ASPN/CILP), Mast cells (TPSAB1/CPA3), Myocytes (MYH2/COX6A2/MYF5).

# Pseudobulk DESeq2 — NL vs CA: 
Pseudobulk aggregation across 23 patients used as true biological replicates. Fibroblasts show the most dramatic reprogramming (5,388 DEGs), consistent with their proportional collapse from 52% to 9%. B/Plasma cells show the strongest downregulation bias (474 up vs 2,289 down). Top upregulated genes: CXCL13 in both T cells and fibroblasts (exhaustion + CAF convergence), ADAM12 (CAF activation), MMP12 (TAM remodeling), COL4A1/COL4A2 (tumor angiogenesis). Top downregulated: LYVE1 (tissue-resident macrophage identity lost), CLEC3B (normal fibroblast marker lost), CFD/APOD (normal B cell programs lost).

# Pseudobulk DESeq2 — CA vs LN: 
Very few DEGs (30/15/20 for T cells/Macrophages/B cells) — biologically meaningful. All DEGs are upregulated in LN, confirming that the tumor immune program established at CA is fully maintained through metastasis.

# Pseudobulk DESeq2 — HPV+ vs HPV– (CA only): 
HPV+ Tcells and macrophages upregulate heat shock proteins (HSPA1A, HSPA6, DNAJB1, BAG3) — HPV viral proteins induce proteotoxic stress. HPV– macrophages are pro-inflammatory chemokine-secreting (CXCL3, CXCL8, CXCL2, CCL3 all higher), consistent with macrophage-rich immunosuppressive TME from Script 04. 113 Tcell DEGs and 182 macrophage DEGs between HPV groups.

**Key Cross-Analysis Finding**: CXCL13 is the top upregulated gene in both T cells AND fibroblasts (NL vs CA) — exhausted T cells and CAFs converge to recruit B cells and form tertiary lymphoid structures, directly explaining B/Plasma cell expansion from 5% (NL) to 18% (CA).
Plots Generated: Top 5 marker heatmap, Top 30 DEG heatmap T cells NL vs CA, 5 volcano plots NL vs CA, 2 volcano plots HPV+ vs HPV–.

# Plots Generated: (GSE181919_DEG_Analysis.pdf)
a) Top 5 marker heatmap
b) Top 30 DEG heatmap T cells NL vs CA
c) 5 volcano plots NL vs CA
d) 2 volcano plots HPV+ vs HPV–


# Step 8 — Cell-Cell Communication Analysis (07_GSE181919_CellChat_Cell-Cell_Communication_Analysis.Rmd)
# Interaction Summary: 
CellChat computed ligand-receptor communication probabilities across 1,609 L-R pairs for 5 conditions using the triMean method across Secreted Signaling, ECM-Receptor, and Cell-Cell Contact databases.
Condition |Cells |Interactions |Strength |Pathways|
NL| 16,384| 688| 17.88| 58
CA| 21,042| 2,123| 51.64| 87
LN| 8,038| 1,731| 56.68| 88
HPV+| 9,030| 1,685| 49.78| 86
HPV– | 12,012| 2,121| 53.45| 89

# Network Centrality — Signaling Role Shifts:
NL: Fibroblasts dominant sender, T cells moderate receiver, all cell types low intensity. 
CA: Fibroblasts remain top sender (outgoing ~18), Macrophages become top receiver (incoming ~9.5), Tcells secondary receiver (~7.8). 
LN: Tcells become highest receiver (~12.3), Macrophages dual sender/receiver, Fibroblasts still top sender.

# Key Mechanistic Circuits Identified:
**CAF Broadcasting:** Fibroblasts send COLLAGEN/LAMININ/FN1/TGFb/VEGF simultaneously to all cell types. COL1A1/1A2, COL4A1/4A2, LAMA2/4 → integrin receptors on Malignant cells at highest intensity — invasion scaffold formation.
**TAM Integration:** Macrophages receive MIF, GALECTIN, CXCL, PLAU signals from all cell types → pro-tumor polarization. VISFATIN pathway: Macrophages as dominant receiver — metabolic immunosuppression.
**T Cell Exhaustion via MHC-I + GALECTIN-TIM3:** ALL cell types present antigen via MHC-I (HLA-A/B/C/E/F → CD8A/CD8B) to CD8+ T cells simultaneously. LGALS9 → HAVCR2 (Galectin-9 → TIM-3) from Dendritic cells confirmed as primary checkpoint axis. CD80 → CTLA4/CD28 from Macrophages adds co-stimulation/inhibition balance layer.
**HPV Immune Evasion:** HPV+ tumors suppress MHC-II signaling (HLA-DR/DQ/DP → CD4) from Dendritic cells to CD4+ T cells — direct viral evasion of helper T cell surveillance absent in HPV– tumors. HPV– compensates with broader GALECTIN and CD80/CTLA4 T cell exhaustion pathways.

Technical Fix Applied: subsetCellChat() required before mergeCellChat() because NL lacks Malignant cells and Epithelial/Myocytes are absent in CA — non-conformable arrays error resolved by subsetting to shared cell types per comparison.


# Step 9 — Pseudotime Trajectory Analysis (08_GSE181919_Trajectory_Analysis_Monocle3.Rmd)
# Trajectory Summary:
Monocle3 pseudotime trajectories were computed for both the full TME (51,849 cells) and the T cell subset (17,533 cells). The full TME CDS was converted from the annotated Seurat object using as.cell_data_set(), with the principal graph learned using ncenter=100 and minimal_branch_len=10. Cells were ordered using NL T cells as the root (3,850 root cells). The T cell CDS was reprocessed through Monocle3's native preprocess_cds() → reduce_dimension() → cluster_cells() pipeline before graph learning (required for Seurat v5 + monocle3 v1.4.26 compatibility). Root cells were set to Naive_Memory state (4,880 cells).

Metric | Value
Full TME cells with finite pseudotime | 47,329 / 51,849
T cells with finite pseudotime | 17,533
T cell pseudotime range | 0 → 5.46
Full TME pseudotime range | 0 → 7.65
Trajectory-variable genes (Moran's I, q<0.05) | 10,833
T cell gene modules | 6

# Full TME Trajectory Findings:
Macrophages have the highest median pseudotime (~4.5) among all cell types, confirming they are maximally reprogrammed from the NL T cell root — consistent with CellChat results showing Macrophages as the top signaling receiver in CA. The LP paradox was observed: LP T cells have higher median pseudotime (1.23) than CA T cells (0.81), reflecting maximal stromal field effect before tumor establishment. LN has the lowest median pseudotime (0.23) despite being the most advanced disease stage, indicating LN selectively receives naïve-like T cells from blood alongside terminally exhausted cells trafficked from the primary tumor.

# T Cell Trajectory — Disease Progression:
HPV+ T cells preferentially route toward the terminal exhaustion arm of the UMAP trajectory, while HPV– T cells retain more effector character in the upper arm. This spatial segregation directly confirms Script 06 and Script 07 findings. LN T cells concentrate in the right (terminal exhaustion) arm despite being the metastatic site — confirming that the exhaustion program established in CA is maintained through metastasis.

# Exhaustion Gene Dynamics Along Pseudotime:
TIGIT is the only checkpoint marker monotonically increasing along the entire pseudotime, making it the dominant progressive checkpoint in HNSCC. CXCL13 peaks early at pseudotime ~0.5 (progenitor exhausted state) and declines — CXCL13+ cells are transitional, not terminal. HAVCR2 and LAG3 show bimodal peaks representing two waves of upregulation. TCF7 declines from pseudotime ~0.3, confirming progenitor state is lost early. FOXP3 rises explosively at pseudotime >3, confirming Treg activation is exclusively a late/terminal event. The exhaustion sequence is: GZMB early activation → CXCL13 intermediate TLS signaling → TIGIT/LAG3 late checkpoint lock → FOXP3 Treg terminal immunosuppression.

# HPV+ vs HPV– Exhaustion Curves:
HPV+ T cells express ~50% more CXCL13 (peak 1.75 vs 1.1) and 2× more HAVCR2 across pseudotime, entering a deeper but more organized exhaustion program. HPV– T cells show shallower but persistent exhaustion — lower checkpoints but sustained PD-1. HPV+ deeper exhaustion paradoxically correlates with better prognosis because the elevated CXCL13 drives stronger TLS formation, creating tertiary lymphoid structures that locally reactivate T cells.

# 6 Gene Co-expression Modules:
Module | Identity | Key Genes | Peak State | Disease Trend
1 | Effector/Exhaustion | CXCL13, LAG3, HAVCR2, GZMB, PRF1, TIGIT, PDCD1, TOX | Treg > Exhausted | NL→LN +3× (2.44→7.42)
2 | Proliferation | STMN1, TYMS, TUBA1B | Progenitor_Tex | CA peak
3 | Intermediate/Stress | TCF7, HSP90AA1, HSPA1A | Progenitor_Tex | NL→CA +2×
4 | Minor contamination | FXYD3, S100A14 | Exhausted | Low throughout
5 | Treg | FOXP3, TNFRSF18, ACTB | Treg >> all | CA/LN specific
6 | Tumor-associated | ELF3, MAGEA4, MDK | Exhausted | CA specific

# Technical Fixes Applied:
1. preprocess_cds() → reduce_dimension() → cluster_cells() required before graph_test() — Seurat v5 stores PCA in a format incompatible with Monocle3's graph autocorrelation test
2. rowData(cds)$gene_short_name must be manually set after as.cell_data_set() conversion — SeuratWrappers v0.4.0 does not populate this field automatically
3. aggregate_gene_expression() format changed in monocle3 v1.4.26 — replaced with manual sapply() aggregation for robustness

# Plots Generated: (GSE181919_Trajectory_plots.pdf)
Full TME plots:
a) GSE181919_fullTME_pseudotime.png — Full TME UMAP colored by pseudotime (0→7.65)
b) GSE181919_fullTME_celltype.png — Full TME UMAP colored by cell type
c) GSE181919_fullTME_tissue.png — Full TME UMAP colored by tissue type
d) GSE181919_fullTME_pseudotime_violin.png — Pseudotime distributions by tissue type and cell type

T cell trajectory plots:
e) GSE181919_trajectory_Tcell_pseudotime.png — T cell UMAP colored by pseudotime (0→5.46)
f) GSE181919_trajectory_Tcell_state.png — T cell UMAP colored by exhaustion state
g) GSE181919_trajectory_Tcell_tissue.png — T cell UMAP colored by tissue type
h) GSE181919_trajectory_Tcell_HPV.png — T cell UMAP colored by HPV status
i) GSE181919_trajectory_Tcell_violins.png — T cell pseudotime violins by state/tissue/HPV

Exhaustion gene feature plots (10 genes):
j) GSE181919_trajectory_Tcell_CXCL13.png — CXCL13 on T cell trajectory
k) GSE181919_trajectory_Tcell_PDCD1.png — PD-1 on T cell trajectory
l) GSE181919_trajectory_Tcell_HAVCR2.png — TIM-3 on T cell trajectory
m) GSE181919_trajectory_Tcell_LAG3.png — LAG-3 on T cell trajectory
n) GSE181919_trajectory_Tcell_TIGIT.png — TIGIT on T cell trajectory
o) GSE181919_trajectory_Tcell_TCF7.png — TCF7 (progenitor marker) on T cell trajectory
p) GSE181919_trajectory_Tcell_TOX.png — TOX (exhaustion TF) on T cell trajectory
q) GSE181919_trajectory_Tcell_FOXP3.png — FOXP3 (Treg) on T cell trajectory
r) GSE181919_trajectory_Tcell_GZMB.png — Granzyme B on T cell trajectory
s) GSE181919_trajectory_Tcell_PRF1.png — Perforin on T cell trajectory

Gene expression curve plots:
t) GSE181919_trajectory_Tcell_gene_curves.png — All 10 exhaustion genes loess-smoothed along pseudotime
u) GSE181919_trajectory_Tcell_gene_curves_faceted.png — Faceted individual gene dynamics along pseudotime
v) GSE181919_trajectory_Tcell_HPV_gene_curves.png — CXCL13/PDCD1/HAVCR2/TOX curves HPV+ vs HPV–

Module heatmaps:
w) GSE181919_trajectory_Tcell_modules_heatmap.png — Gene modules × T cell exhaustion states
x) GSE181919_trajectory_Tcell_modules_tissue_heatmap.png — Gene modules × tissue type
