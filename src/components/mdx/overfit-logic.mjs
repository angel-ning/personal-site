// ISOM 5160 Day 1 slide 25: overfitting, shown as polynomial curve fitting.
// Same 10 training points every time (fixed noise), plus 10 unseen test points from the same curve.

const truth = (x) => Math.sin(Math.PI * x) * 1.2 + 0.4 * x;
const TRAIN_NOISE = [0.29, -0.35, 0.16, 0.4, -0.24, -0.45, 0.32, -0.08, 0.48, -0.32];
const TEST_NOISE = [-0.16, 0.24, -0.32, 0.08, 0.35, -0.19, 0.13, -0.4, 0.19, 0.03];

export const OVERFIT_TRAIN = TRAIN_NOISE.map((e, i) => { const x = -1 + (2 * i) / 9; return { x, y: truth(x) + e }; });
export const OVERFIT_TEST = TEST_NOISE.map((e, i) => { const x = -0.95 + (1.9 * i) / 9 + 0.04; return { x, y: truth(x) + e }; });
export const OVERFIT_MAX_DEGREE = 9;
export const overfitTruth = truth;

// Least squares via normal equations + Gaussian elimination with partial pivoting.
export function polyFit(points, degree) {
  const n = degree + 1;
  const A = Array.from({ length: n }, () => new Array(n + 1).fill(0));
  for (const { x, y } of points) {
    const pw = Array.from({ length: n }, (_, k) => x ** k);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) A[r][c] += pw[r] * pw[c];
      A[r][n] += pw[r] * y;
    }
  }
  for (let r = 0; r < n; r++) A[r][r] += 1e-10;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = A[r][c] / A[c][c];
      for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k];
    }
  }
  return A.map((row, i) => row[n] / row[i]);
}

export const polyEval = (coef, x) => coef.reduce((acc, a, k) => acc + a * x ** k, 0);
const mse = (coef, pts) => pts.reduce((acc, p) => acc + (polyEval(coef, p.x) - p.y) ** 2, 0) / pts.length;

export function verdict(degree) {
  if (degree <= 2) return { id: "under", label: "Underfitting 欠拟合", text: "模型太简单，连训练数据的规律都没学到：训练误差和测试误差都高。" };
  if (degree <= 4) return { id: "good", label: "刚好 (good fit)", text: "抓住了大趋势、没去追每个噪声点：测试误差最低的区间。" };
  return { id: "over", label: "Overfitting 过拟合", text: "模型把训练数据（包括噪声）背了下来：训练误差接近 0，但换一批没见过的数据就错得离谱。" };
}

export function fitDegree(degree) {
  const coef = polyFit(OVERFIT_TRAIN, degree);
  return { degree, coef, train: mse(coef, OVERFIT_TRAIN), test: mse(coef, OVERFIT_TEST), ...verdict(degree) };
}

export const overfitTable = () => Array.from({ length: OVERFIT_MAX_DEGREE + 1 }, (_, d) => fitDegree(d));
