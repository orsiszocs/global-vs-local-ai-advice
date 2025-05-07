// implementation from https://github.com/mljs/matrix

function hypotenuse(a, b) {
    let r = 0;
    if (Math.abs(a) > Math.abs(b)) {
        r = b / a;
        return Math.abs(a) * Math.sqrt(1 + r * r);
    }
    if (b !== 0) {
        r = a / b;
        return Math.abs(b) * Math.sqrt(1 + r * r);
    }
    return 0;
}

function singularValueDecomposition(matrix) {
    let m = matrix.size()[0];
    let n = matrix.size()[1];

    let wantu = true;
    let wantv = true;

    let swapped = false;
    let a;
    if (m < n) {
        a = math.transpose(matrix);
        m = a.size()[0];
        n = a.size()[1];
        swapped = true;
        let aux = wantu;
        wantu = wantv;
        wantv = aux;
    }
    else {
        a = math.clone(matrix);
    }

    let nu = Math.min(m, n);
    let ni = Math.min(m + 1, n);
    let s = math.zeros(ni);
    let U = math.zeros(m, nu);
    let V = math.zeros(n, n);

    let e = math.zeros(n);
    let work = math.zeros(m);

    let si = math.zeros(ni);
    for (let i = 0; i < ni; i++) si[i] = i;

    let nct = Math.min(m - 1, n);
    let nrt = Math.max(0, Math.min(n - 2, m));
    let mrc = Math.max(nct, nrt);

    for (let k = 0; k < mrc; k++) {
        if (k < nct) {
            s[k] = 0;
            for (let i = k; i < m; i++) {
                s[k] = hypotenuse(s[k], a.get([i, k]));
            }
            if (s[k] !== 0) {
                if (a.get([k, k]) < 0) {
                    s[k] = -s[k];
                }
                for (let i = k; i < m; i++) {
                    a.set([i, k], a.get([i, k]) / s[k]);
                }
                a.set([k, k], a.get([k, k]) + 1);
            }
            s[k] = -s[k];
        }

        for (let j = k + 1; j < n; j++) {
            if (k < nct && s[k] !== 0) {
                let t = 0;
                for (let i = k; i < m; i++) {
                    t += a.get([i, k]) * a.get([i, j]);
                }
                t = -t / a.get([k, k]);
                for (let i = k; i < m; i++) {
                    a.set([i, j], a.get([i, j]) + t * a.get([i, k]));
                }
            }
            e[j] = a.get([k, j]);
        }

        if (wantu && k < nct) {
            for (let i = k; i < m; i++) {
                U.set([i, k], a.get([i, k]));
            }
        }

        if (k < nrt) {
            e[k] = 0;
            for (let i = k + 1; i < n; i++) {
                e[k] = hypotenuse(e[k], e[i]);
            }
            if (e[k] !== 0) {
                if (e[k + 1] < 0) {
                    e[k] = 0 - e[k];
                }
                for (let i = k + 1; i < n; i++) {
                    e[i] /= e[k];
                }
                e[k + 1] += 1;
            }
            e[k] = -e[k];
            if (k + 1 < m && e[k] !== 0) {
                for (let i = k + 1; i < m; i++) {
                    work[i] = 0;
                }
                for (let i = k + 1; i < m; i++) {
                    for (let j = k + 1; j < n; j++) {
                        work[i] += e[j] * a.get([i, j]);
                    }
                }
                for (let j = k + 1; j < n; j++) {
                    let t = -e[j] / e[k + 1];
                    for (let i = k + 1; i < m; i++) {
                        a.set([i, j], a.get([i, j]) + t * work[i]);
                    }
                }
            }
            if (wantv) {
                for (let i = k + 1; i < n; i++) {
                    V.set([i, k], e[i]);
                }
            }
        }
    }

    let p = Math.min(n, m + 1);
    if (nct < n) {
        s[nct] = a.get([nct, nct]);
    }
    if (m < p) {
        s[p - 1] = 0;
    }
    if (nrt + 1 < p) {
        e[nrt] = a.get([nrt, p - 1]);
    }
    e[p - 1] = 0;

    if (wantu) {
        for (let j = nct; j < nu; j++) {
            for (let i = 0; i < m; i++) {
                U.set([i, j], 0);
            }
            U.set([j, j], 1);
        }
        for (let k = nct - 1; k >= 0; k--) {
            if (s[k] !== 0) {
                for (let j = k + 1; j < nu; j++) {
                    let t = 0;
                    for (let i = k; i < m; i++) {
                        t += U.get([i, k]) * U.get([i, j]);
                    }
                    t = -t / U.get([k, k]);
                    for (let i = k; i < m; i++) {
                        U.set([i, j], U.get([i, j]) + t * U.get([i, k]));
                    }
                }
                for (let i = k; i < m; i++) {
                    U.set([i, k], -U.get([i, k]));
                }
                U.set([k, k], 1 + U.get([k, k]));
                for (let i = 0; i < k - 1; i++) {
                    U.set([i, k], 0);
                }
            } else {
                for (let i = 0; i < m; i++) {
                    U.set([i, k], 0);
                }
                U.set([k, k], 1);
            }
        }
    }

    if (wantv) {
        for (let k = n - 1; k >= 0; k--) {
            if (k < nrt && e[k] !== 0) {
                for (let j = k + 1; j < n; j++) {
                    let t = 0;
                    for (let i = k + 1; i < n; i++) {
                        t += V.get([i, k]) * V.get([i, j]);
                    }
                    t = -t / V.get([k + 1, k]);
                    for (let i = k + 1; i < n; i++) {
                        V.set([i, j], V.get([i, j]) + t * V.get([i, k]));
                    }
                }
            }
            for (let i = 0; i < n; i++) {
                V.set([i, k], 0);
            }
            V.set([k, k], 1);
        }
    }

    let pp = p - 1;
    let iter = 0;
    let eps = Number.EPSILON;
    while (p > 0) {
        let k, kase;
        for (k = p - 2; k >= -1; k--) {
            if (k === -1) {
                break;
            }
            const alpha =
                Number.MIN_VALUE + eps * Math.abs(s[k] + Math.abs(s[k + 1]));
            if (Math.abs(e[k]) <= alpha || Number.isNaN(e[k])) {
                e[k] = 0;
                break;
            }
        }
        if (k === p - 2) {
            kase = 4;
        } else {
            let ks;
            for (ks = p - 1; ks >= k; ks--) {
                if (ks === k) {
                    break;
                }
                let t =
                    (ks !== p ? Math.abs(e[ks]) : 0) +
                    (ks !== k + 1 ? Math.abs(e[ks - 1]) : 0);
                if (Math.abs(s[ks]) <= eps * t) {
                    s[ks] = 0;
                    break;
                }
            }
            if (ks === k) {
                kase = 3;
            } else if (ks === p - 1) {
                kase = 1;
            } else {
                kase = 2;
                k = ks;
            }
        }

        k++;

        switch (kase) {
            case 1: {
                let f = e[p - 2];
                e[p - 2] = 0;
                for (let j = p - 2; j >= k; j--) {
                    let t = hypotenuse(s[j], f);
                    let cs = s[j] / t;
                    let sn = f / t;
                    s[j] = t;
                    if (j !== k) {
                        f = -sn * e[j - 1];
                        e[j - 1] = cs * e[j - 1];
                    }
                    if (wantv) {
                        for (let i = 0; i < n; i++) {
                            t = cs * V.get([i, j]) + sn * V.get([i, p - 1]);
                            V.set([i, p - 1], -sn * V.get([i, j]) + cs * V.get([i, p - 1]));
                            V.set([i, j], t);
                        }
                    }
                }
                break;
            }
            case 2: {
                let f = e[k - 1];
                e[k - 1] = 0;
                for (let j = k; j < p; j++) {
                    let t = hypotenuse(s[j], f);
                    let cs = s[j] / t;
                    let sn = f / t;
                    s[j] = t;
                    f = -sn * e[j];
                    e[j] = cs * e[j];
                    if (wantu) {
                        for (let i = 0; i < m; i++) {
                            t = cs * U.get([i, j]) + sn * U.get([i, k - 1]);
                            U.set([i, k - 1], -sn * U.get([i, j]) + cs * U.get([i, k - 1]));
                            U.set([i, j], t);
                        }
                    }
                }
                break;
            }
            case 3: {
                const scale = Math.max(
                    Math.abs(s[p - 1]),
                    Math.abs(s[p - 2]),
                    Math.abs(e[p - 2]),
                    Math.abs(s[k]),
                    Math.abs(e[k]),
                );
                const sp = s[p - 1] / scale;
                const spm1 = s[p - 2] / scale;
                const epm1 = e[p - 2] / scale;
                const sk = s[k] / scale;
                const ek = e[k] / scale;
                const b = ((spm1 + sp) * (spm1 - sp) + epm1 * epm1) / 2;
                const c = sp * epm1 * (sp * epm1);
                let shift = 0;
                if (b !== 0 || c !== 0) {
                    if (b < 0) {
                        shift = 0 - Math.sqrt(b * b + c);
                    } else {
                        shift = Math.sqrt(b * b + c);
                    }
                    shift = c / (b + shift);
                }
                let f = (sk + sp) * (sk - sp) + shift;
                let g = sk * ek;
                for (let j = k; j < p - 1; j++) {
                    let t = hypotenuse(f, g);
                    if (t === 0) t = Number.MIN_VALUE;
                    let cs = f / t;
                    let sn = g / t;
                    if (j !== k) {
                        e[j - 1] = t;
                    }
                    f = cs * s[j] + sn * e[j];
                    e[j] = cs * e[j] - sn * s[j];
                    g = sn * s[j + 1];
                    s[j + 1] = cs * s[j + 1];
                    if (wantv) {
                        for (let i = 0; i < n; i++) {
                            t = cs * V.get([i, j]) + sn * V.get([i, j + 1]);
                            V.set([i, j + 1], -sn * V.get([i, j]) + cs * V.get([i, j + 1]));
                            V.set([i, j], t);
                        }
                    }
                    t = hypotenuse(f, g);
                    if (t === 0) t = Number.MIN_VALUE;
                    cs = f / t;
                    sn = g / t;
                    s[j] = t;
                    f = cs * e[j] + sn * s[j + 1];
                    s[j + 1] = -sn * e[j] + cs * s[j + 1];
                    g = sn * e[j + 1];
                    e[j + 1] = cs * e[j + 1];
                    if (wantu && j < m - 1) {
                        for (let i = 0; i < m; i++) {
                            t = cs * U.get([i, j]) + sn * U.get([i, j + 1]);
                            U.set([i, j + 1], -sn * U.get([i, j]) + cs * U.get([i, j + 1]));
                            U.set([i, j], t);
                        }
                    }
                }
                e[p - 2] = f;
                iter = iter + 1;
                break;
            }
            case 4: {
                if (s[k] <= 0) {
                    s[k] = s[k] < 0 ? -s[k] : 0;
                    if (wantv) {
                        for (let i = 0; i <= pp; i++) {
                            V.set([i, k], -V.get([i, k]));
                        }
                    }
                }
                while (k < pp) {
                    if (s[k] >= s[k + 1]) {
                        break;
                    }
                    let t = s[k];
                    s[k] = s[k + 1];
                    s[k + 1] = t;
                    if (wantv && k < n - 1) {
                        for (let i = 0; i < n; i++) {
                            t = V.get([i, k + 1]);
                            V.set([i, k + 1], V.get([i, k]));
                            V.set([i, k], t);
                        }
                    }
                    if (wantu && k < m - 1) {
                        for (let i = 0; i < m; i++) {
                            t = U.get([i, k + 1]);
                            U.set([i, k + 1], U.get([i, k]));
                            U.set([i, k], t);
                        }
                    }
                    k++;
                }
                iter = 0;
                p--;
                break;
            }
        }
    }

    if (swapped) {
        let tmp = V;
        V = U;
        U = tmp;
    }

    return { "leftSingularVectors": U, "diagonalMatrix": s, "rightSingularVectors": V };
}

function scalingMatrix(data) {
    let rows = data.size()[0];

    let matrix = math.zeros(rows, rows);
    for (let i = 0; i < rows; i++) {
      matrix.set([i, i], data[i]);
    }
    return matrix;
}

function maxSingularValue(s) {
    let max = 0;
    for (let i = 0; i < s.size()[0]; i++) {
        if (s[i] > max) {
            max = s[i];
        }
    }
    return max;
}

function pseudoInverse(matrix) {
    let svd = singularValueDecomposition(matrix);
    let U = svd.leftSingularVectors;
    let s = svd.diagonalMatrix;
    let V = svd.rightSingularVectors;

    for (let i = 0; i < s.size()[0]; i++) {
        if (Math.abs(s[i]) > 0.00001 * maxSingularValue(s)) {
            s[i] = 1.0 / s[i];
        } else {
            s[i] = 0.0;
        }
    }
    s = scalingMatrix(s);

    return math.multiply(V, math.multiply(s, math.transpose(U)));
}

export { pseudoInverse };