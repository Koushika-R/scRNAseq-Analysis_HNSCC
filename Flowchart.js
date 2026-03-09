import { useState } from "react";

const steps = [
  {
    id: 1,
    script: "Script 01",
    title: "Data Acquisition",
    subtitle: "GEO Download",
    color: "#4ECDC4",
    dark: "#1a3a39",
    inputs: [],
    process: [
      "Download GSE181919 from NCBI GEO",
      "GSE181919_UMI_counts.txt.gz — 20,000 genes × 54,239 cells",
      "GSE181919_Barcode_metadata.txt.gz — 8 metadata columns"
    ],
    outputs: [
      "GSE181919_UMI_counts.txt.gz",
      "GSE181919_Barcode_metadata.txt.gz"
    ],
    key_numbers: ["54,239 cells", "20,000 genes", "23 patients", "37 samples"]
  },
  {
    id: 2,
    script: "Script 02",
    title: "Seurat Object Creation",
    subtitle: "01_GSE181919_Creating_Seurat_Object.Rmd",
    color: "#FFE66D",
    dark: "#3a3a1a",
    inputs: ["GSE181919_UMI_counts.txt.gz", "GSE181919_Barcode_metadata.txt.gz"],
    process: [
      "Load UMI matrix — 20,000 genes × 54,239 cells",
      "Fix barcode format: dot → hyphen",
      "Filter to 15,086 protein-coding genes",
      "Apply min.cells=3, min.features=200",
      "Add 8 metadata columns (tissue.type, hpv, cell.type, etc.)"
    ],
    outputs: ["01_GSE181919_seurat_raw.rds"],
    key_numbers: ["54,236 cells retained", "15,086 genes", "4,914 non-coding removed"]
  },
  {
    id: 3,
    script: "Script 03",
    title: "QC & Batch Correction",
    subtitle: "02_GSE181919_QC_BatchCorrection.Rmd",
    color: "#FF6B6B",
    dark: "#3a1a1a",
    inputs: ["01_GSE181919_seurat_raw.rds"],
    process: [
      "MT filtering >15% → removes 43 cells",
      "Mahalanobis distance filter (worst 5%) → removes 2,344 cells",
      "Skip ribosomal filter (HNSCC — >97% cells would be lost)",
      "LogNormalize + 2,500 HVGs + 100 PCA → 50 PCs (89.3% variance)",
      "Harmony batch correction by patient.id (23 patients)",
      "Same-batch fraction: 0.470 → 0.247 (47.4% reduction)"
    ],
    outputs: [
      "02_GSE181919_seurat_processed.rds",
      "GSE181919_Quality_Control.pdf",
      "GSE181919_ElbowPlot.pdf",
      "GSE181919_Batch_Correction.pdf"
    ],
    key_numbers: ["51,849 cells post-QC", "95.6% retention", "30 Harmony clusters", "89.3% variance @ 50 PCs"]
  },
  {
    id: 4,
    script: "Script 04",
    title: "CellTypist Annotation",
    subtitle: "03_GSE181919_CellTypist_Annotation.Rmd",
    color: "#A8E6CF",
    dark: "#1a3a2a",
    inputs: ["02_GSE181919_seurat_processed.rds"],
    process: [
      "Model: Immune_All_High.pkl (20 human tissues)",
      "Run via reticulate (Python from R) — avoids 16GB RAM crash",
      "Per-cell prediction (majority_voting=FALSE)",
      "Validate against author labels",
      "Map 29 CellTypist subtypes → 10 author cell types"
    ],
    outputs: [
      "03_GSE181919_celltypist_labeled.rds",
      "GSE181919_UMAP_CellTypist_Annotation.pdf"
    ],
    key_numbers: [">89% accuracy 8/10 types", "Mast cells 98.1%", "T cells 94.3%", "Malignant→Epithelial 83.3%"]
  },
  {
    id: 5,
    script: "Script 05",
    title: "TME Analysis",
    subtitle: "04_GSE181919_TME_Analysis.Rmd",
    color: "#C3A6FF",
    dark: "#2a1a3a",
    inputs: ["03_GSE181919_celltypist_labeled.rds"],
    process: [
      "Cell type proportions across NL → LP → CA → LN",
      "TME compartment ratios (Immune/Stromal/Malignant)",
      "HPV+ vs HPV– composition (CA only)",
      "Canonical marker gene dot plot (40 genes × 10 types)",
      "Final annotated object saved"
    ],
    outputs: [
      "05_GSE181919_celltypist_annotated.rds",
      "GSE181919_TME_Analysis_plots.pdf"
    ],
    key_numbers: ["Fibroblasts 52%→2% NL→LN", "T cells 25%→57%", "HPV+ T cell-rich 50%", "HPV– Macrophage-rich 21%"]
  },
  {
    id: 6,
    script: "Script 06",
    title: "T Cell Exhaustion Analysis",
    subtitle: "05_GSE181919_T_Cell_Exhaustion_Analysis.Rmd",
    color: "#FFB347",
    dark: "#3a2a1a",
    inputs: ["05_GSE181919_celltypist_annotated.rds"],
    process: [
      "Subset T cells (17,533 cells) → re-cluster at resolution 0.5 → 19 subclusters",
      "UCell scoring: 5 states (Exhausted/Effector/Naive_Memory/Treg/Progenitor_Tex)",
      "HPV+ vs HPV– Wilcoxon tests (all 5 states p<0.0001)",
      "State proportions across NL/LP/CA/LN",
      "Assign tcell_state label to each T cell"
    ],
    outputs: [
      "06_GSE181919_Tcells_exhaustion.rds",
      "GSE181919_T_Cell_Exhaustion_Analysis.pdf"
    ],
    key_numbers: ["17,533 T cells", "19 subclusters", "5 exhaustion states", "Exhausted higher in HPV–"]
  },
  {
    id: 7,
    script: "Script 07",
    title: "Differential Expression",
    subtitle: "06_GSE181919_DifferentialExpression.Rmd",
    color: "#FF8ED4",
    dark: "#3a1a2a",
    inputs: ["05_GSE181919_celltypist_annotated.rds", "06_GSE181919_Tcells_exhaustion.rds"],
    process: [
      "FindAllMarkers → 9,206 marker genes across 10 cell types",
      "Pseudobulk DESeq2 NL vs CA (23 patient replicates)",
      "Pseudobulk DESeq2 CA vs LN",
      "Pseudobulk DESeq2 HPV+ vs HPV– (CA only)",
      "Volcano plots + heatmaps per comparison"
    ],
    outputs: [
      "results/DEG/GSE181919_markers_all_celltypes.csv",
      "results/DEG/GSE181919_DEG_NL_vs_CA_*.csv (per cell type)",
      "results/DEG/GSE181919_DEG_CA_vs_LN_*.csv",
      "results/DEG/GSE181919_DEG_HPV_*.csv",
      "GSE181919_DEG_Analysis.pdf"
    ],
    key_numbers: ["9,206 marker genes", "Fibroblasts: 5,388 DEGs NL→CA", "CA→LN: only 30 T cell DEGs", "CXCL13 #1 in T cells + Fibroblasts"]
  },
  {
    id: 8,
    script: "Script 08",
    title: "CellChat Communication",
    subtitle: "07_GSE181919_CellChat_Analysis.Rmd",
    color: "#69D2E7",
    dark: "#1a2a3a",
    inputs: ["05_GSE181919_celltypist_annotated.rds"],
    process: [
      "Build 5 CellChat objects: NL / CA / LN / HPV+ / HPV–",
      "1,609 L-R pairs | triMean method | 3 databases",
      "subsetCellChat() → mergeCellChat() (fix non-conformable arrays)",
      "Network centrality: sender/receiver scores per cell type",
      "Differential interactions: NL vs CA, CA vs LN, HPV– vs HPV+",
      "Bubble plots: exhaustion (MHC-I/GALECTIN/CD80) + stromal pathways"
    ],
    outputs: [
      "results/CellChat/GSE181919_cellchat_NL/CA/LN/HPVpos/HPVneg.rds",
      "results/CellChat/GSE181919_CellChat_summary.csv",
      "results/CellChat/GSE181919_*_pathways.csv (5 files)",
      "plots/CellChat_plots/ (15 PNGs)"
    ],
    key_numbers: ["NL: 688 interactions", "CA: 2,123 (3.1×↑)", "LN: 1,731", "HPV–: 26% more than HPV+"]
  },
  {
    id: 9,
    script: "Script 09",
    title: "Trajectory Analysis",
    subtitle: "08_GSE181919_trajectory_monocle3.R",
    color: "#B5EAD7",
    dark: "#1a3a2a",
    inputs: ["05_GSE181919_celltypist_annotated.rds", "06_GSE181919_Tcells_exhaustion.rds"],
    process: [
      "Full TME CDS: as.cell_data_set() → learn_graph(ncenter=100)",
      "Order cells: root = NL T cells (3,850 cells)",
      "T cell CDS: preprocess_cds() → reduce_dimension() → learn_graph()",
      "Fix: rowData$gene_short_name must be set manually (SeuratWrappers v0.4.0)",
      "Moran's I graph_test → 10,833 trajectory-variable genes",
      "find_gene_modules(resolution=0.1) → 6 co-expression modules",
      "Gene curves: CXCL13/PDCD1/HAVCR2/TOX HPV+ vs HPV–"
    ],
    outputs: [
      "results/Trajectory/GSE181919_monocle3_Tcell.rds",
      "results/Trajectory/GSE181919_monocle3_fullTME.rds",
      "results/Trajectory/GSE181919_Tcell_pseudotime.csv",
      "results/Trajectory/GSE181919_fullTME_pseudotime.csv",
      "results/Trajectory/GSE181919_trajectory_Tcell_variable_genes.csv",
      "results/Trajectory/GSE181919_trajectory_Tcell_gene_modules.csv",
      "plots/Trajectory_plots/ (24 PNGs)"
    ],
    key_numbers: ["47,329 cells with pseudotime", "10,833 variable genes", "6 gene modules", "Module 1 NL→LN 3×↑"]
  },
  {
    id: 10,
    script: "Script 10",
    title: "Integration & Summary",
    subtitle: "09_GSE181919_Integration_Summary.R",
    color: "#FFDAC1",
    dark: "#3a2a1a",
    inputs: [
      "05_GSE181919_celltypist_annotated.rds",
      "06_GSE181919_Tcells_exhaustion.rds",
      "GSE181919_Tcell_pseudotime.csv",
      "GSE181919_fullTME_pseudotime.csv",
      "GSE181919_CellChat_summary.csv",
      "GSE181919_trajectory_Tcell_gene_modules.csv"
    ],
    process: [
      "Fig 1: Master TME Overview (UMAP + proportions + compartments + HPV)",
      "Fig 2: Exhaustion Summary (states + UCell + pseudotime + Module 1)",
      "Fig 3: HPV Dashboard (scores + CellChat + pseudotime + CXCL13/HAVCR2)",
      "Fig 4: CXCL13 Story (feature + DEG rank + B cell expansion + violin)",
      "Fig 5: CellChat × Trajectory (interactions + PT × exhaustion scatter)",
      "Master statistics table (33 headline metrics from all 8 scripts)"
    ],
    outputs: [
      "plots/Summary_plots/GSE181919_Fig1_TME_Overview.png",
      "plots/Summary_plots/GSE181919_Fig2_Exhaustion_Summary.png",
      "plots/Summary_plots/GSE181919_Fig3_HPV_Dashboard.png",
      "plots/Summary_plots/GSE181919_Fig4_CXCL13_Story.png",
      "plots/Summary_plots/GSE181919_Fig5_CellChat_Trajectory.png",
      "results/Summary/GSE181919_master_summary_statistics.csv"
    ],
    key_numbers: ["5 multi-panel figures", "33 summary metrics", "Scripts 01–09 integrated", "Publication-ready"]
  }
];

const findings = [
  { icon: "🔬", text: "CXCL13 is #1 DEG in both T cells AND Fibroblasts → drives B/Plasma 5%→18% expansion (TLS formation)" },
  { icon: "📈", text: "CellChat 3.1× NL→CA ≈ Trajectory Module 1 3.0× NL→LN — intercellular + transcriptional signals converge" },
  { icon: "🦠", text: "HPV+: deeper exhaustion (HAVCR2 2×) + more CXCL13 (1.75 vs 1.1) → better TLS → better prognosis" },
  { icon: "🎯", text: "TIGIT is the only monotonically increasing checkpoint → primary therapeutic target in HNSCC" },
  { icon: "⚡", text: "Macrophages: CellChat top receiver CA + highest pseudotime = fully reprogrammed TAMs" },
  { icon: "🌿", text: "Treg activation is a late/terminal event (PT>3, CA/LN only) — immunosuppression is acquired, not pre-existing" },
];

export default function Flowchart() {
  const [expanded, setExpanded] = useState({});
  const [activeTab, setExpanded2] = useState("process");

  const toggle = (id, tab) => {
    setExpanded(prev => {
      const isOpen = prev[id] === tab;
      return { ...prev, [id]: isOpen ? null : tab };
    });
  };

  return (
    <div style={{
      background: "#0d1117",
      minHeight: "100vh",
      fontFamily: "'Georgia', serif",
      color: "#e6edf3",
      padding: "0 0 60px 0"
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #161b22 0%, #0d1117 100%)",
        borderBottom: "1px solid #30363d",
        padding: "40px 40px 30px",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: "radial-gradient(circle at 20% 50%, rgba(78,205,196,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(169,110,255,0.06) 0%, transparent 50%)",
          pointerEvents: "none"
        }} />
        <div style={{ maxWidth: 960, margin: "0 auto", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
            <div style={{
              background: "linear-gradient(135deg, #4ECDC4, #69D2E7)",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 11,
              fontFamily: "'Courier New', monospace",
              fontWeight: 700,
              letterSpacing: 2,
              color: "#0d1117"
            }}>GSE181919</div>
            <div style={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 11,
              fontFamily: "'Courier New', monospace",
              letterSpacing: 1,
              color: "#8b949e"
            }}>HNSCC scRNA-seq | 51,849 cells | 23 patients</div>
          </div>
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            margin: "0 0 8px",
            letterSpacing: -0.5,
            lineHeight: 1.2,
            color: "#f0f6fc"
          }}>Analysis Pipeline Flowchart</h1>
          <p style={{
            fontSize: 14,
            color: "#8b949e",
            margin: 0,
            fontFamily: "'Courier New', monospace"
          }}>10 scripts · 9 analysis steps · click any step to expand inputs, process & outputs</p>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px" }}>

        {/* Steps */}
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const activeSection = expanded[step.id];

          return (
            <div key={step.id} style={{ position: "relative" }}>
              {/* Connector line */}
              {!isLast && (
                <div style={{
                  position: "absolute",
                  left: 35,
                  top: "100%",
                  width: 2,
                  height: 28,
                  background: `linear-gradient(to bottom, ${step.color}60, ${steps[idx+1].color}60)`,
                  zIndex: 1
                }} />
              )}

              <div style={{ marginTop: 28 }}>
                {/* Main card */}
                <div style={{
                  background: "#161b22",
                  border: `1px solid ${step.color}30`,
                  borderLeft: `3px solid ${step.color}`,
                  borderRadius: 10,
                  overflow: "hidden",
                  transition: "box-shadow 0.2s",
                  boxShadow: activeSection ? `0 0 0 1px ${step.color}20, 0 4px 24px rgba(0,0,0,0.4)` : "none"
                }}>
                  {/* Header row */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "16px 20px",
                    gap: 16,
                    cursor: "default"
                  }}>
                    {/* Step badge */}
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      background: `${step.color}18`,
                      border: `2px solid ${step.color}50`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontFamily: "'Courier New', monospace",
                      fontSize: 12,
                      fontWeight: 700,
                      color: step.color,
                      letterSpacing: -0.5
                    }}>S{step.id < 10 ? "0" : ""}{step.id === 10 ? "10" : step.id - 1 < 9 ? `0${step.id}` : step.id}</div>

                    {/* Title block */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: "#f0f6fc",
                          letterSpacing: -0.3
                        }}>{step.title}</span>
                        <span style={{
                          fontSize: 11,
                          fontFamily: "'Courier New', monospace",
                          color: step.color,
                          background: `${step.color}15`,
                          padding: "2px 8px",
                          borderRadius: 4
                        }}>{step.script}</span>
                      </div>
                      <div style={{
                        fontSize: 11,
                        fontFamily: "'Courier New', monospace",
                        color: "#6e7681",
                        marginTop: 3,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>{step.subtitle}</div>
                    </div>

                    {/* Key numbers */}
                    <div style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                      maxWidth: 320
                    }}>
                      {step.key_numbers.map((n, i) => (
                        <span key={i} style={{
                          fontSize: 10,
                          fontFamily: "'Courier New', monospace",
                          color: "#8b949e",
                          background: "#21262d",
                          border: "1px solid #30363d",
                          padding: "3px 8px",
                          borderRadius: 4,
                          whiteSpace: "nowrap"
                        }}>{n}</span>
                      ))}
                    </div>
                  </div>

                  {/* Tab buttons */}
                  <div style={{
                    display: "flex",
                    borderTop: "1px solid #21262d",
                    background: "#0d1117"
                  }}>
                    {step.inputs.length > 0 && (
                      <button onClick={() => toggle(step.id, "inputs")}
                        style={{
                          flex: 1,
                          padding: "9px 12px",
                          background: activeSection === "inputs" ? `${step.color}15` : "transparent",
                          border: "none",
                          borderBottom: activeSection === "inputs" ? `2px solid ${step.color}` : "2px solid transparent",
                          color: activeSection === "inputs" ? step.color : "#6e7681",
                          fontSize: 11,
                          fontFamily: "'Courier New', monospace",
                          fontWeight: 600,
                          cursor: "pointer",
                          letterSpacing: 0.5,
                          transition: "all 0.15s"
                        }}>
                        ↓ INPUTS ({step.inputs.length})
                      </button>
                    )}
                    <button onClick={() => toggle(step.id, "process")}
                      style={{
                        flex: 1,
                        padding: "9px 12px",
                        background: activeSection === "process" ? `${step.color}15` : "transparent",
                        border: "none",
                        borderBottom: activeSection === "process" ? `2px solid ${step.color}` : "2px solid transparent",
                        color: activeSection === "process" ? step.color : "#6e7681",
                        fontSize: 11,
                        fontFamily: "'Courier New', monospace",
                        fontWeight: 600,
                        cursor: "pointer",
                        letterSpacing: 0.5,
                        transition: "all 0.15s"
                      }}>
                      ⚙ PROCESS ({step.process.length})
                    </button>
                    <button onClick={() => toggle(step.id, "outputs")}
                      style={{
                        flex: 1,
                        padding: "9px 12px",
                        background: activeSection === "outputs" ? `${step.color}15` : "transparent",
                        border: "none",
                        borderBottom: activeSection === "outputs" ? `2px solid ${step.color}` : "2px solid transparent",
                        color: activeSection === "outputs" ? step.color : "#6e7681",
                        fontSize: 11,
                        fontFamily: "'Courier New', monospace",
                        fontWeight: 600,
                        cursor: "pointer",
                        letterSpacing: 0.5,
                        transition: "all 0.15s"
                      }}>
                      ↑ OUTPUTS ({step.outputs.length})
                    </button>
                  </div>

                  {/* Expanded content */}
                  {activeSection && (
                    <div style={{
                      padding: "16px 20px",
                      background: `${step.dark}80`,
                      borderTop: `1px solid ${step.color}20`
                    }}>
                      {activeSection === "inputs" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {step.inputs.map((inp, i) => (
                            <div key={i} style={{
                              display: "flex", alignItems: "center", gap: 10
                            }}>
                              <span style={{ color: "#58a6ff", fontSize: 12 }}>→</span>
                              <code style={{
                                fontSize: 12,
                                fontFamily: "'Courier New', monospace",
                                color: "#79c0ff",
                                background: "#161b22",
                                padding: "4px 10px",
                                borderRadius: 4,
                                border: "1px solid #30363d"
                              }}>{inp}</code>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeSection === "process" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {step.process.map((proc, i) => (
                            <div key={i} style={{
                              display: "flex", alignItems: "flex-start", gap: 10
                            }}>
                              <span style={{
                                color: step.color,
                                fontSize: 11,
                                fontFamily: "'Courier New', monospace",
                                fontWeight: 700,
                                minWidth: 24,
                                paddingTop: 1
                              }}>{String(i+1).padStart(2,"0")}.</span>
                              <span style={{
                                fontSize: 13,
                                color: "#c9d1d9",
                                lineHeight: 1.5
                              }}>{proc}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeSection === "outputs" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {step.outputs.map((out, i) => (
                            <div key={i} style={{
                              display: "flex", alignItems: "center", gap: 10
                            }}>
                              <span style={{ color: "#3fb950", fontSize: 12 }}>✓</span>
                              <code style={{
                                fontSize: 12,
                                fontFamily: "'Courier New', monospace",
                                color: "#7ee787",
                                background: "#161b22",
                                padding: "4px 10px",
                                borderRadius: 4,
                                border: "1px solid #30363d"
                              }}>{out}</code>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Key Findings */}
        <div style={{
          marginTop: 48,
          background: "#161b22",
          border: "1px solid #30363d",
          borderTop: "3px solid #4ECDC4",
          borderRadius: 10,
          padding: "28px 28px 24px"
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12, marginBottom: 20
          }}>
            <div style={{
              background: "rgba(78,205,196,0.15)",
              border: "1px solid rgba(78,205,196,0.3)",
              borderRadius: 6,
              padding: "4px 12px",
              fontSize: 10,
              fontFamily: "'Courier New', monospace",
              fontWeight: 700,
              color: "#4ECDC4",
              letterSpacing: 2
            }}>KEY FINDINGS</div>
            <span style={{ fontSize: 13, color: "#6e7681", fontFamily: "'Courier New', monospace" }}>
              cross-script headline results
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {findings.map((f, i) => (
              <div key={i} style={{
                background: "#0d1117",
                border: "1px solid #21262d",
                borderRadius: 8,
                padding: "14px 16px",
                display: "flex",
                gap: 12,
                alignItems: "flex-start"
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{f.icon}</span>
                <span style={{ fontSize: 12.5, color: "#c9d1d9", lineHeight: 1.6 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Software table */}
        <div style={{
          marginTop: 24,
          background: "#161b22",
          border: "1px solid #30363d",
          borderRadius: 10,
          padding: "24px 28px"
        }}>
          <div style={{
            fontSize: 10,
            fontFamily: "'Courier New', monospace",
            fontWeight: 700,
            color: "#FFE66D",
            letterSpacing: 2,
            marginBottom: 16,
            background: "rgba(255,230,109,0.1)",
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: 4,
            border: "1px solid rgba(255,230,109,0.2)"
          }}>SOFTWARE VERSIONS</div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8
          }}>
            {[
              ["Seurat","5.x"], ["Harmony","1.x"], ["CellTypist","1.x"], ["UCell","2.x"],
              ["DESeq2","1.x"], ["CellChat","≥2.1.0"], ["monocle3","1.4.26"], ["SeuratWrappers","0.4.0"],
              ["ggplot2","3.x"], ["patchwork","1.x"], ["dplyr","1.x"], ["R","4.5"]
            ].map(([pkg, ver], i) => (
              <div key={i} style={{
                background: "#0d1117",
                border: "1px solid #21262d",
                borderRadius: 6,
                padding: "8px 12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span style={{ fontSize: 12, fontFamily: "'Courier New', monospace", color: "#c9d1d9" }}>{pkg}</span>
                <span style={{ fontSize: 11, fontFamily: "'Courier New', monospace", color: "#6e7681" }}>{ver}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}