import { Product, ProductCustomization } from '../types';
import { PRODUCTS_DATA, formatCOP } from '../data/products';

export interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  autoCommitOnSave: boolean;
  customDomain?: string; // Ej: urbannoise.co o https://urbannoise.pages.dev
}

const STORAGE_GITHUB_KEY = 'urbannoise_github_config_v1';

const DEFAULT_GITHUB_PAT = (import.meta as any).env?.VITE_GITHUB_TOKEN || '';

// Obtener configuración guardada de GitHub (o variables de entorno Vite si existen)
export function getGitHubConfig(): GitHubConfig {
  try {
    const raw = localStorage.getItem(STORAGE_GITHUB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.branch === 'main' && (!parsed.repo || parsed.repo === 'urbannoise')) {
        parsed.branch = 'master';
      }
      if (!parsed.token) {
        parsed.token = DEFAULT_GITHUB_PAT;
      }
      return parsed;
    }
  } catch {}

  return {
    owner: (import.meta as any).env?.VITE_GITHUB_OWNER || 'tusoporteapp',
    repo: (import.meta as any).env?.VITE_GITHUB_REPO || 'urbannoise',
    branch: (import.meta as any).env?.VITE_GITHUB_BRANCH || 'master',
    token: DEFAULT_GITHUB_PAT,
    autoCommitOnSave: true,
    customDomain: (import.meta as any).env?.VITE_CLOUDFLARE_PAGES_URL || 'https://urbannoise.co',
  };
}

// Guardar configuración de GitHub en el navegador del administrador
export function saveGitHubConfig(config: Partial<GitHubConfig>): GitHubConfig {
  const current = getGitHubConfig();
  let selectedBranch = (config.branch ?? current.branch).trim() || 'master';
  if (selectedBranch === 'main') {
    selectedBranch = 'master';
  }

  const updated: GitHubConfig = {
    ...current,
    ...config,
    owner: (config.owner ?? current.owner).trim() || 'tusoporteapp',
    repo: (config.repo ?? current.repo).trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '') || 'urbannoise',
    branch: selectedBranch,
    token: (config.token ?? current.token).trim(),
    autoCommitOnSave: config.autoCommitOnSave ?? current.autoCommitOnSave ?? true,
    customDomain: (config.customDomain ?? current.customDomain ?? '').trim(),
  };

  localStorage.setItem(STORAGE_GITHUB_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('urbannoise_github_config_updated', { detail: updated }));
  return updated;
}

export function isGitHubConfigured(config?: GitHubConfig): boolean {
  const cfg = config || getGitHubConfig();
  return Boolean(cfg.owner && cfg.repo && cfg.token);
}

// Probar conexión en vivo con el repositorio de GitHub
export async function testGitHubConnection(config?: GitHubConfig): Promise<{
  success: boolean;
  repoName?: string;
  isPrivate?: boolean;
  defaultBranch?: string;
  permissions?: { push: boolean; pull: boolean; admin: boolean };
  error?: string;
}> {
  const cfg = config || getGitHubConfig();
  if (!cfg.owner || !cfg.repo || !cfg.token) {
    return {
      success: false,
      error: 'Debes ingresar el Usuario/Organización, el Nombre del Repositorio y el Token de GitHub (PAT).',
    };
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}`, {
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (res.status === 401) {
      return { success: false, error: 'Token inválido o expirado. Genera un nuevo Personal Access Token (PAT) con permisos de "repo" o "Contents: Read & write".' };
    }
    if (res.status === 404) {
      return { success: false, error: `No se encontró el repositorio "${cfg.owner}/${cfg.repo}". Verifica que el nombre esté bien escrito y que el token tenga acceso al repositorio.` };
    }
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.message || `Error HTTP ${res.status} al conectar con GitHub` };
    }

    const data = await res.json();
    return {
      success: true,
      repoName: data.full_name,
      isPrivate: data.private,
      defaultBranch: data.default_branch,
      permissions: data.permissions,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Error de red al conectar con GitHub: ${err.message || 'Sin conexión'}`,
    };
  }
}

// Obtener el SHA de un archivo existente en GitHub para poder actualizarlo
export async function getFileSha(path: string, cfg: GitHubConfig): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}?ref=${cfg.branch}`,
      {
        headers: {
          Authorization: `Bearer ${cfg.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      return data.sha;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export interface UploadImageResult {
  success: boolean;
  path: string;
  cdnUrl: string;
  proxyUrl?: string;
  rawUrl: string;
  localPath: string;
  sha?: string;
  error?: string;
}

// Subir y commitear una imagen directamente al repositorio de GitHub
export async function uploadImageToGitHub({
  file,
  base64,
  filename,
  sku,
  config,
}: {
  file?: File;
  base64?: string;
  filename?: string;
  sku: string;
  config?: GitHubConfig;
}): Promise<UploadImageResult> {
  const cfg = config || getGitHubConfig();

  if (!isGitHubConfigured(cfg)) {
    return {
      success: false,
      path: '',
      cdnUrl: '',
      rawUrl: '',
      localPath: '',
      error: 'GitHub no está configurado. Por favor ingresa tus credenciales de GitHub en la pestaña "GitHub & Cloudflare".',
    };
  }

  try {
    // 1. Obtener Base64 limpio sin prefijos de data URL
    let cleanBase64 = '';
    let ext = 'jpg';
    let rawFilename = filename || (file ? file.name : `img-${Date.now()}.jpg`);

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      cleanBase64 = btoa(binary);
      const nameParts = file.name.split('.');
      if (nameParts.length > 1) {
        ext = nameParts.pop()?.toLowerCase() || 'jpg';
      }
    } else if (base64) {
      if (base64.includes(';base64,')) {
        const parts = base64.split(';base64,');
        cleanBase64 = parts[1];
        if (parts[0].includes('image/png')) ext = 'png';
        else if (parts[0].includes('image/webp')) ext = 'webp';
        else if (parts[0].includes('image/gif')) ext = 'gif';
      } else {
        cleanBase64 = base64;
      }
    }

    if (!cleanBase64) {
      return { success: false, path: '', cdnUrl: '', rawUrl: '', localPath: '', error: 'Contenido de imagen no válido.' };
    }

    // 2. Normalizar nombre y ruta de guardado dentro del repositorio
    const safeSku = sku.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const safeName = rawFilename
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '-')
      .replace(/\s+/g, '-');
    
    const timestamp = Date.now().toString().slice(-6);
    const finalFilename = safeName.endsWith(`.${ext}`) ? `${safeName.replace(`.${ext}`, '')}-${timestamp}.${ext}` : `${safeName}-${timestamp}.${ext}`;
    const targetPath = `images/products/${safeSku}/${finalFilename}`;

    // 3. Verificar si el archivo ya existe (para pasar el SHA en updates)
    const existingSha = await getFileSha(targetPath, cfg);

    // 4. Commitear archivo a GitHub mediante REST API
    const commitMsg = `Subir foto lookbook ${finalFilename} para ${sku.toUpperCase()} [URBANNOISE Studio]`;
    const putRes = await fetch(
      `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${targetPath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${cfg.token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: commitMsg,
          content: cleanBase64,
          branch: cfg.branch,
          ...(existingSha ? { sha: existingSha } : {}),
        }),
      }
    );

    if (!putRes.ok) {
      const errData = await putRes.json().catch(() => ({}));
      return {
        success: false,
        path: targetPath,
        cdnUrl: '',
        rawUrl: '',
        localPath: '',
        error: errData.message || `Error al guardar en GitHub (Status ${putRes.status})`,
      };
    }

    const resData = await putRes.json();

    // 5. Construir URLs accesibles
    const proxyUrl = `/api/github/image?path=${encodeURIComponent(targetPath)}`;
    // - jsdelivr CDN: Ultra-rápido, con caché mundial de Cloudflare, disponible en segundos si el repositorio es público
    const cdnUrl = `https://cdn.jsdelivr.net/gh/${cfg.owner}/${cfg.repo}@${cfg.branch}/${targetPath}`;
    // - GitHub Raw: URL directa de reserva
    const rawUrl = `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}/${targetPath}`;
    // - Ruta relativa local: servida por Cloudflare Pages directamente al construirse el proyecto
    const localPath = `/${targetPath.replace(/^public\//, '')}`;

    return {
      success: true,
      path: targetPath,
      cdnUrl,
      proxyUrl,
      rawUrl,
      localPath,
      sha: resData.content?.sha,
    };
  } catch (err: any) {
    return {
      success: false,
      path: '',
      cdnUrl: '',
      rawUrl: '',
      localPath: '',
      error: `Excepción al subir imagen: ${err.message || err}`,
    };
  }
}

// Subir video de lookbook (MP4 / WebM comprimido y silencioso) a GitHub y CDN
export async function uploadProductVideoToGitHub(options: {
  file?: File;
  blob?: Blob;
  base64?: string;
  filename?: string;
  sku: string;
  config?: GitHubConfig;
}): Promise<{
  success: boolean;
  path: string;
  cdnUrl: string;
  rawUrl: string;
  localPath: string;
  sha?: string;
  error?: string;
}> {
  const { file, blob, base64, filename, sku, config } = options;
  const cfg = config || getGitHubConfig();

  if (!cfg.token) {
    return {
      success: false,
      path: '',
      cdnUrl: '',
      rawUrl: '',
      localPath: '',
      error: 'Debes configurar tu Token de GitHub (PAT) en el panel para subir videos.',
    };
  }

  try {
    let cleanBase64 = '';
    let ext = 'mp4';
    let rawFilename = filename || (file ? file.name : `video-${Date.now()}.mp4`);

    if (blob || file) {
      const sourceBlob = blob || file!;
      const arrayBuffer = await sourceBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      let binary = '';
      const chunkSize = 0x8000; // 32KB chunks seguros
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize) as any);
      }
      cleanBase64 = btoa(binary);

      if (sourceBlob.type.includes('webm')) {
        ext = 'webm';
      } else if (sourceBlob.type.includes('mp4')) {
        ext = 'mp4';
      } else if (file) {
        const parts = file.name.split('.');
        if (parts.length > 1) ext = parts.pop()?.toLowerCase() || 'mp4';
      }
    } else if (base64) {
      if (base64.includes(';base64,')) {
        const parts = base64.split(';base64,');
        cleanBase64 = parts[1];
        if (parts[0].includes('video/webm')) ext = 'webm';
        else if (parts[0].includes('video/mp4')) ext = 'mp4';
      } else {
        cleanBase64 = base64;
      }
    }

    if (!cleanBase64) {
      return { success: false, path: '', cdnUrl: '', rawUrl: '', localPath: '', error: 'Contenido de video no válido.' };
    }

    const safeSku = sku.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const safeName = rawFilename
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '-')
      .replace(/\s+/g, '-');

    const timestamp = Date.now().toString().slice(-6);
    const finalFilename = safeName.endsWith(`.${ext}`)
      ? `${safeName.replace(`.${ext}`, '')}-${timestamp}.${ext}`
      : `${safeName}-${timestamp}.${ext}`;
    const targetPath = `videos/products/${safeSku}/${finalFilename}`;

    const existingSha = await getFileSha(targetPath, cfg);

    const commitMsg = `Subir video lookbook ${finalFilename} para ${sku.toUpperCase()} [URBANNOISE Studio]`;
    let resSha = '';

    // Intentar primero con la API de Git Blobs (esencial para archivos binarios mayores a 1MB hasta 100MB)
    try {
      const blobRes = await fetch(
        `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/git/blobs`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfg.token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: cleanBase64,
            encoding: 'base64',
          }),
        }
      );

      if (blobRes.ok) {
        const blobData = await blobRes.json();
        const blobSha = blobData.sha;
        resSha = blobSha;

        // Obtener última referencia de la rama
        const refRes = await fetch(
          `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/git/ref/heads/${cfg.branch}`,
          {
            headers: {
              Authorization: `Bearer ${cfg.token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );

        if (refRes.ok) {
          const refData = await refRes.json();
          const parentCommitSha = refData.object.sha;

          // Obtener tree del commit base
          const commitRes = await fetch(
            `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/git/commits/${parentCommitSha}`,
            {
              headers: {
                Authorization: `Bearer ${cfg.token}`,
                Accept: 'application/vnd.github.v3+json',
              },
            }
          );

          if (commitRes.ok) {
            const commitData = await commitRes.json();
            const baseTreeSha = commitData.tree.sha;

            // Crear nuevo tree con el blob
            const treeRes = await fetch(
              `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/git/trees`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${cfg.token}`,
                  Accept: 'application/vnd.github.v3+json',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  base_tree: baseTreeSha,
                  tree: [
                    {
                      path: targetPath,
                      mode: '100644',
                      type: 'blob',
                      sha: blobSha,
                    },
                  ],
                }),
              }
            );

            if (treeRes.ok) {
              const treeData = await treeRes.json();

              // Crear nuevo commit
              const newCommitRes = await fetch(
                `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/git/commits`,
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${cfg.token}`,
                    Accept: 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    message: commitMsg,
                    tree: treeData.sha,
                    parents: [parentCommitSha],
                  }),
                }
              );

              if (newCommitRes.ok) {
                const newCommitData = await newCommitRes.json();
                // Actualizar la rama
                await fetch(
                  `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/git/refs/heads/${cfg.branch}`,
                  {
                    method: 'PATCH',
                    headers: {
                      Authorization: `Bearer ${cfg.token}`,
                      Accept: 'application/vnd.github.v3+json',
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      sha: newCommitData.sha,
                      force: false,
                    }),
                  }
                );
              }
            }
          }
        }
      } else {
        // Fallback a API de contents (para archivos pequeños)
        const existingSha = await getFileSha(targetPath, cfg);
        const putRes = await fetch(
          `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${targetPath}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${cfg.token}`,
              Accept: 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: commitMsg,
              content: cleanBase64,
              branch: cfg.branch,
              ...(existingSha ? { sha: existingSha } : {}),
            }),
          }
        );

        if (!putRes.ok) {
          const errData = await putRes.json().catch(() => ({}));
          return {
            success: false,
            path: targetPath,
            cdnUrl: '',
            rawUrl: '',
            localPath: '',
            error: errData.message || `Error al guardar video en GitHub (Status ${putRes.status})`,
          };
        }
        const resData = await putRes.json();
        resSha = resData.content?.sha || '';
      }
    } catch (gitErr: any) {
      console.warn('Error en Git Blobs API, probando fallback contents:', gitErr);
      const existingSha = await getFileSha(targetPath, cfg);
      const putRes = await fetch(
        `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${targetPath}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${cfg.token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: commitMsg,
            content: cleanBase64,
            branch: cfg.branch,
            ...(existingSha ? { sha: existingSha } : {}),
          }),
        }
      );

      if (!putRes.ok) {
        const errData = await putRes.json().catch(() => ({}));
        return {
          success: false,
          path: targetPath,
          cdnUrl: '',
          rawUrl: '',
          localPath: '',
          error: errData.message || `Error al guardar video en GitHub (Status ${putRes.status})`,
        };
      }
      const resData = await putRes.json();
      resSha = resData.content?.sha || '';
    }

    const cdnUrl = `https://cdn.jsdelivr.net/gh/${cfg.owner}/${cfg.repo}@${cfg.branch}/${targetPath}`;
    const rawUrl = `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}/${targetPath}`;
    const localPath = `/${targetPath.replace(/^public\//, '')}`;

    return {
      success: true,
      path: targetPath,
      cdnUrl,
      rawUrl,
      localPath,
      sha: resSha,
    };
  } catch (err: any) {
    return {
      success: false,
      path: '',
      cdnUrl: '',
      rawUrl: '',
      localPath: '',
      error: `Excepción al subir video: ${err.message || err}`,
    };
  }
}

// Motor de optimización de video en navegador: Quitar pista de audio y comprimir a resolución y bitrate web
export async function prepareVideoForWeb(
  file: File,
  onProgress?: (percent: number, status: string) => void
): Promise<{
  file: File;
  blob: Blob;
  base64: string;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  duration: number;
  width: number;
  height: number;
  error?: string;
}> {
  return new Promise(async (resolve) => {
    try {
      const originalSize = file.size;

      // 1. Crear elemento de video offscreen
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;

      const cleanup = () => {
        try {
          URL.revokeObjectURL(objectUrl);
          video.remove();
        } catch {}
      };

      video.onerror = () => {
        cleanup();
        file.arrayBuffer().then((buf) => {
          const bytes = new Uint8Array(buf);
          let binary = '';
          const chunkSize = 0x8000;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize) as any);
          }
          const base64 = btoa(binary);
          resolve({
            file,
            blob: file,
            base64,
            dataUrl: `data:${file.type};base64,${base64}`,
            originalSize,
            compressedSize: originalSize,
            duration: 0,
            width: 1080,
            height: 1440,
          });
        });
      };

      await new Promise<void>((resLoaded) => {
        video.onloadedmetadata = () => resLoaded();
      });

      const duration = Math.max(1, video.duration || 5);
      const origWidth = video.videoWidth || 1080;
      const origHeight = video.videoHeight || 1920;

      // Escalar dimensiones si exceden 1280p
      const maxDim = 1280;
      let targetWidth = origWidth;
      let targetHeight = origHeight;
      if (origWidth > maxDim || origHeight > maxDim) {
        if (origWidth > origHeight) {
          targetHeight = Math.round((origHeight * maxDim) / origWidth);
          targetWidth = maxDim;
        } else {
          targetWidth = Math.round((origWidth * maxDim) / origHeight);
          targetHeight = maxDim;
        }
      }
      targetWidth = Math.floor(targetWidth / 2) * 2;
      targetHeight = Math.floor(targetHeight / 2) * 2;

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      const canRecord =
        typeof MediaRecorder !== 'undefined' &&
        typeof (canvas as any).captureStream === 'function' &&
        ctx !== null;

      if (!canRecord) {
        cleanup();
        const arrayBuf = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuf);
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize) as any);
        }
        const base64 = btoa(binary);
        resolve({
          file,
          blob: file,
          base64,
          dataUrl: `data:${file.type};base64,${base64}`,
          originalSize,
          compressedSize: originalSize,
          duration,
          width: targetWidth,
          height: targetHeight,
        });
        return;
      }

      onProgress?.(5, 'Extrayendo audio y optimizando video...');

      // Captura de video stream del canvas (0 pistas de audio garantizado)
      const stream = (canvas as any).captureStream(30);

      let mimeType = 'video/webm;codecs=vp9';
      let fileExt = 'webm';
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
        mimeType = 'video/mp4;codecs=avc1';
        fileExt = 'mp4';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
        fileExt = 'mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        mimeType = 'video/webm;codecs=vp9';
        fileExt = 'webm';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
        fileExt = 'webm';
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2_200_000,
      });

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunks.push(ev.data);
        }
      };

      recorder.onstop = async () => {
        cleanup();
        const finalBlob = new Blob(chunks, { type: mimeType });
        const compressedSize = finalBlob.size;

        const baseName = file.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
        const cleanName = `${baseName}.${fileExt}`;
        const finalFile = new File([finalBlob], cleanName, { type: mimeType });

        const arrayBuf = await finalBlob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuf);
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize) as any);
        }
        const base64 = btoa(binary);

        onProgress?.(100, 'Video optimizado al 100% (Sin audio)');
        resolve({
          file: finalFile,
          blob: finalBlob,
          base64,
          dataUrl: `data:${mimeType};base64,${base64}`,
          originalSize,
          compressedSize,
          duration,
          width: targetWidth,
          height: targetHeight,
        });
      };

      recorder.start(100);

      video.currentTime = 0;
      await video.play().catch(() => {});

      let animId: number;
      const renderLoop = () => {
        if (video.ended || video.paused || video.currentTime >= duration) {
          cancelAnimationFrame(animId);
          if (recorder.state === 'recording') {
            recorder.stop();
          }
          return;
        }

        ctx!.drawImage(video, 0, 0, targetWidth, targetHeight);
        const percent = Math.min(98, Math.round((video.currentTime / duration) * 95) + 5);
        onProgress?.(percent, `Procesando video silencioso (${percent}%)...`);

        animId = requestAnimationFrame(renderLoop);
      };

      video.onended = () => {
        cancelAnimationFrame(animId);
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      };

      setTimeout(() => {
        if (recorder.state === 'recording') {
          cancelAnimationFrame(animId);
          recorder.stop();
        }
      }, (duration + 3) * 1000);

      animId = requestAnimationFrame(renderLoop);
    } catch {
      file.arrayBuffer().then((buf) => {
        const bytes = new Uint8Array(buf);
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize) as any);
        }
        const base64 = btoa(binary);
        resolve({
          file,
          blob: file,
          base64,
          dataUrl: `data:${file.type};base64,${base64}`,
          originalSize: file.size,
          compressedSize: file.size,
          duration: 0,
          width: 1080,
          height: 1440,
        });
      });
    }
  });
}

export interface AICatalogProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  category_label: string;
  collection: string;
  price_cop: number;
  price_formatted: string;
  currency: 'COP';
  stock: number;
  in_stock: boolean;
  available_sizes: string[];
  size_chart_cm: Record<string, any>;
  color: string;
  fit: string;
  material: string;
  print_technique: string;
  care_instructions: string[];
  features: string[];
  description: string;
  images: string[];
  main_image: string;
  tags: string[];
  availability: {
    physical_store: string;
    national_shipping: string;
    delivery_time: string;
  };
  product_url: string;
  whatsapp_order_url: string;
  ai_sales_pitch: string;
}

export interface AICatalogData {
  store_info: {
    brand_name: string;
    concept: string;
    city: string;
    country: string;
    flagship_address: string;
    shopping_center: string;
    store_location: string;
    hours: string;
    whatsapp_sales: string;
    phone: string;
    website_url: string;
    catalog_json_url: string;
  };
  policies: {
    shipping: string;
    returns_and_exchanges: string;
    payment_methods: string[];
  };
  collections_summary: Record<string, string>;
  total_products: number;
  generated_at: string;
  products: AICatalogProduct[];
}

// Generar estructura completa del catálogo optimizada para Agentes e Inteligencia Artificial de Cloudflare
export function generateAICatalog(
  products: Product[],
  config?: GitHubConfig
): AICatalogData {
  const cfg = config || getGitHubConfig();
  const baseUrl = (cfg.customDomain || 'https://urbannoise.pages.dev').replace(/\/$/, '');
  const catalogJsonUrl = `${baseUrl}/catalog/products.json`;

  const formattedProducts: AICatalogProduct[] = (products && products.length > 0 ? products : PRODUCTS_DATA)
    .filter((p) => p.isPublished !== false)
    .map((p) => {
      const sku = (p.sku || p.id).toUpperCase();
      const name = p.name || 'Prenda Streetwear URBANNOISE';
      const desc = p.desc || '';
      const price = p.price || 50000;
      const images = p.images && p.images.length > 0 ? p.images : [p.image];
      const stock = typeof p.stock === 'number' ? p.stock : 10;
      const in_stock = stock > 0;

      // Determinar colección y etiqueta amigable
      let categoryLabel = 'Últimos Lanzamientos / Drops';
      let collection = 'Latest Drops';
      if (p.category === 'young-free') {
        categoryLabel = 'Cápsula Young & Free';
        collection = 'Young & Free';
      } else if (p.category === 'weird-oversize') {
        categoryLabel = 'Cápsula Weird Oversize';
        collection = 'Weird';
      } else if (p.category === 'dama-oversize') {
        categoryLabel = 'Cápsula Dama Oversize';
        collection = 'Dama Oversize';
      }

      // Extracción de color
      let color = p.color || '';
      if (!color) {
        const colorMatch = desc.match(/Color ([^.]+)\./i);
        if (colorMatch) {
          color = colorMatch[1].trim();
        } else {
          color = 'Varios / Ver Fotos';
        }
      }

      // Detección de tipo de prenda, silueta y medidas
      const upperName = name.toUpperCase();
      let fit = p.fit || 'Oversized Boxy Fit con hombros caídos y cuello rib grueso';
      let material = '100% Algodón peinado nacional prémium de alto gramaje (210g - 240g/m²)';
      let print_technique = 'Serigrafía textil de alta definición al tacto cero';
      let available_sizes = ['S', 'M', 'L', 'XL'];
      let size_chart_cm: Record<string, any> = {
        S: { chest_cm: 56, length_cm: 72, sleeve_cm: 24 },
        M: { chest_cm: 58, length_cm: 74, sleeve_cm: 25 },
        L: { chest_cm: 60, length_cm: 76, sleeve_cm: 26 },
        XL: { chest_cm: 62, length_cm: 78, sleeve_cm: 27 },
      };

      if (upperName.includes('HOODIE') || upperName.includes('BUZO') || upperName.includes('CREWNECK')) {
        fit = 'Silueta Oversize Boxy abrigada con capota doble y bolsillo canguro reforzado';
        material = 'Felpa perchada de alto gramaje 320g/m² 80% algodón 20% poliéster';
        print_technique = 'Serigrafía puff en relieve 3D de alta densidad';
        size_chart_cm = {
          S: { chest_cm: 60, length_cm: 70, sleeve_cm: 62 },
          M: { chest_cm: 62, length_cm: 72, sleeve_cm: 64 },
          L: { chest_cm: 65, length_cm: 75, sleeve_cm: 66 },
          XL: { chest_cm: 68, length_cm: 78, sleeve_cm: 68 },
        };
      } else if (upperName.includes('GORRA') || upperName.includes('SNAPBACK') || upperName.includes('TRUCKER')) {
        fit = 'Corona estructurada de 6 paneles con visera precurvada y broche snapback regulable';
        material = 'Drill de algodón nacional y malla poliéster transpirable con bordado 3D';
        print_technique = 'Bordado industrial en relieve 3D';
        available_sizes = ['Única Ajustable'];
        size_chart_cm = {
          'Única': { circumference_cm: '54 cm - 61 cm regulable' },
        };
      } else if (upperName.includes('TOTE') || upperName.includes('CANVAS')) {
        fit = 'Bolsa tote bag utilitaria de hombro con fuelle amplio';
        material = 'Lona canvas pesada 100% algodón crudo de 14 onzas';
        available_sizes = ['Única'];
        size_chart_cm = {
          'Única': { chest_cm: 40, length_cm: 42, sleeve_cm: 30 },
        };
      } else if (upperName.includes('PANTALÓN') || upperName.includes('CARGO')) {
        fit = 'Relaxed fit urbano con 6 bolsillos utilitarios y bota ajustable con cordón';
        material = 'Drill pesado 100% algodón de alta resistencia a la tracción';
        size_chart_cm = {
          S: { waist_in: '30-32', length_cm: 102 },
          M: { waist_in: '32-34', length_cm: 104 },
          L: { waist_in: '34-36', length_cm: 106 },
          XL: { waist_in: '36-38', length_cm: 108 },
        };
      } else if (upperName.includes('BOMBER') || upperName.includes('CHAQUETA') || upperName.includes('CHALECO')) {
        fit = 'Streetwear oversize con cremallera frontal y bolsillos tácticos';
        material = 'Ripstop repelente al agua con forro térmico interno';
        size_chart_cm = {
          S: { chest_cm: 58, length_cm: 68, sleeve_cm: 62 },
          M: { chest_cm: 61, length_cm: 71, sleeve_cm: 64 },
          L: { chest_cm: 64, length_cm: 74, sleeve_cm: 66 },
          XL: { chest_cm: 67, length_cm: 76, sleeve_cm: 68 },
        };
      }

      const care_instructions = [
        'Lavar a máquina en ciclo suave con agua fría (< 30°C)',
        'Lavar siempre la prenda al revés para proteger el estampado',
        'No usar blanqueador ni detergentes abrasivos',
        'No planchar directamente sobre el estampado o bordado',
        'Secar a la sombra, no retorcer ni usar secadora a alta temperatura',
      ];

      const features = [
        'Confección 100% en Bogotá, Colombia',
        'Corte oversize auténtico con caída pesada',
        'Etiqueta tejida de autenticidad URBANNOISE',
        'Disponible en tienda física El GranSan y despacho nacional',
      ];

      const product_url = `${baseUrl}/?product=${p.id}`;
      const whatsappText = `¡Hola URBANNOISE! Vi en la tienda la prenda: "${name}" (SKU: ${sku}) por ${formatCOP(price)}. ¿Tienen disponibilidad en mi talla para envío o retiro en tienda El GranSan?`;
      const whatsapp_order_url = `https://wa.me/573108720491?text=${encodeURIComponent(whatsappText)}`;

      const tags = [
        'streetwear',
        'oversize',
        'urbannoise',
        collection.toLowerCase(),
        color.toLowerCase(),
        'moda urbana',
        'bogota',
        'gransan',
      ];

      const ai_sales_pitch = `${name} (${formatCOP(price)}): Confeccionada en ${material} con silueta ${fit}. Ideal para outfit streetwear auténtico. Disponibilidad inmediata en tienda El GranSan o envío nacional.`;

      return {
        id: p.id,
        sku,
        name,
        category: p.category,
        category_label: categoryLabel,
        collection,
        price_cop: price,
        price_formatted: formatCOP(price),
        currency: 'COP' as const,
        stock,
        in_stock,
        available_sizes,
        size_chart_cm,
        color,
        fit,
        material,
        print_technique,
        care_instructions,
        features,
        description: desc,
        images,
        main_image: images[0] || p.image,
        tags,
        availability: {
          physical_store: 'Centro Comercial El GranSan, Bogotá - Piso 2, Local 2137',
          national_shipping: 'Envíos a toda Colombia vía Servientrega / Interrapidísimo / Envía',
          delivery_time: 'Bogotá: 24 a 48 horas hábiles. Ciudades principales: 2 a 4 días hábiles.',
        },
        product_url,
        whatsapp_order_url,
        ai_sales_pitch,
      };
    });

  return {
    store_info: {
      brand_name: 'URBANNOISE Studio',
      concept: 'Streetwear colombiano contemporáneo, cortes oversized y siluetas urbanas',
      city: 'Bogotá D.C.',
      country: 'Colombia',
      flagship_address: 'Centro Comercial El GranSan, Carrera 10 # 9-37, Piso 2, Local 2137',
      shopping_center: 'CC El GranSan',
      store_location: 'Piso 2, Local 2137',
      hours: 'Lunes a Sábado: 8:00 AM - 6:30 PM | Miércoles y Sábado de Madrugón: 4:00 AM - 6:30 PM',
      whatsapp_sales: '+57 321 987 6543',
      phone: '+57 321 987 6543',
      website_url: baseUrl,
      catalog_json_url: catalogJsonUrl,
    },
    policies: {
      shipping: 'Envíos gratis por compras superiores a $180.000 COP en Bogotá y principales ciudades de Colombia. Guía con seguimiento online en tiempo real.',
      returns_and_exchanges: '30 días calendario para cambios por talla o garantía de confección en tienda física o vía mensajería nacional.',
      payment_methods: [
        'Bold Checkout Oficial (Tarjetas Visa, Mastercard, American Express)',
        'PSE (Todos los bancos de Colombia)',
        'Nequi y Daviplata',
        'Efectivo o Datáfono en tienda física Bogotá El GranSan',
      ],
    },
    collections_summary: {
      'latest-drops': 'Prendas recién salidas del taller con estampados experimentales y siluetas boxy',
      'young-free': 'Gráficos nostálgicos, ilustraciones frescas y colorways retro pastel',
      'weird-oversize': 'Tipografías grunge, calaveras, efecto acid wash mineral y actitud underground',
      'dama-oversize': 'Siluetas fluidas, crop hoodies, fits oversized pensados para mujer streetwear',
    },
    total_products: formattedProducts.length,
    generated_at: new Date().toISOString(),
    products: formattedProducts,
  };
}

// Descargar archivo products.json generado en el navegador
export function downloadAICatalogJson(products: Product[], config?: GitHubConfig): void {
  const data = generateAICatalog(products, config);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'urbannoise-catalog-ai.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Generar Prompt de Sistema Blindado (Guardrails) para que la IA SOLO hable de URBANNOISE
export function generateAISystemPrompt(config?: GitHubConfig): string {
  const cfg = config || getGitHubConfig();
  const domain = (cfg.customDomain || 'https://urbannoise.pages.dev').replace(/\/$/, '');

  return `Eres el Asistente Virtual Oficial de Ventas y Estilo de URBANNOISE Studio (Marca colombiana de streetwear contemporáneo confeccionada en Bogotá, con siluetas oversized y algodón de alto gramaje de 210g a 320g).

OBJETIVO PRINCIPAL:
Asesorar con calidez a los clientes en la selección de prendas, guiarlos con recomendaciones exactas de talla según sus medidas corporales, responder dudas de envíos/pagos y cerrar ventas facilitando el enlace de compra web o WhatsApp.

REGLAS DE ORO Y BLINDAJE INQUEBRANTABLE (GUARDRAILS & ANTI-ALUCINACIÓN):
1. RESTRICCIÓN DE CONTEXTO EXCLUSIVO (GROUNDING ESTRICTO):
- ÚNICAMENTE conoces y recomiendas las prendas, colecciones, precios, inventario y políticas oficiales de URBANNOISE presentes en tu catálogo (${domain}/catalog/products.json).
- NUNCA inventes prendas que no existan, ni inventes precios, promociones falsas o materiales inexistentes.
- Si una prenda está agotada o no existe en el catálogo, indícalo amablemente y ofrece una alternativa real de nuestras colecciones (Latest Drops, Young & Free, Weird Oversize o Dama).

2. PROHIBICIÓN ABSOLUTA DE MARCAS EXTERNAS O TEMAS AJENOS:
- Jamás hables de marcas de la competencia ni recomiendes productos externos (Nike, Adidas, Zara, H&M, Shein, etc.). Si te preguntan por ellas, responde amablemente: "En URBANNOISE confeccionamos nuestras propias prendas exclusivas en Bogotá con siluetas oversized y algodón de alto gramaje 100% colombiano. Te invito a conocer nuestros diseños oficiales en: ${domain}".
- No respondas sobre temas ajenos a URBANNOISE (política, cocina, programación, tareas escolares, etc.). Si te preguntan sobre temas no relacionados, responde cortésmente: "Solo puedo asesorarte sobre prendas, tallaje, pedidos y envíos de URBANNOISE Studio. ¿Hay alguna prenda o estilo que te interese ver?".

3. ASESORÍA DE TALLAJE CON MEDIDAS EN CENTÍMETROS:
- Cuando el cliente pregunte qué talla le sirve según su estatura o peso (ej. "mido 1.75m y peso 70kg"), explícale que las prendas son corte "Oversized Boxy Fit" (hombro caído) y utiliza las medidas exactas en centímetros:
  * Talla S: Pecho 56 cm | Largo 72 cm | Manga 24 cm
  * Talla M: Pecho 58 cm | Largo 74 cm | Manga 25 cm
  * Talla L: Pecho 60 cm | Largo 76 cm | Manga 26 cm
  * Talla XL: Pecho 62 cm | Largo 78 cm | Manga 27 cm
  (Para buzos/hoodies el largo es 70-78cm y pecho 60-68cm con felpa pesada de 320g).

4. TIENDA FÍSICA Y ENVÍOS:
- Tienda física: Centro Comercial El GranSan, Bogotá D.C. (Carrera 10 # 9-37, Piso 2, Local 2137). Horario: Lunes a Sábado de 8:00 AM a 6:30 PM (Madrugón Miércoles y Sábado desde las 4:00 AM).
- Envíos: A toda Colombia asegurados vía Servientrega/Interrapidísimo/Envía. Gratis por compras superiores a $180.000 COP. Bogotá llega en 24-48 horas hábiles; otras ciudades en 2-4 días hábiles.
- Medios de pago: Bold (Tarjetas de crédito/débito), PSE, Nequi, Daviplata, o Efectivo/Datafono en la tienda física de Bogotá.

5. CIERRE DE VENTA OBLIGATORIO:
- Siempre que el cliente muestre interés en comprar o pregunte por disponibilidad, entrégale:
  1. El enlace de la prenda en la tienda web: ${domain}/?product=[id]
  2. El enlace directo a WhatsApp para atención y compra inmediata con mensaje precargado.

TONO Y PERSONALIDAD:
- Juvenil, urbano, respetuoso, apasionado por el streetwear, cercano (estilo bogotano contemporáneo, cálido y profesional).
- Respuestas directas, concisas y fáciles de leer en pantalla de celular o chat.`;
}

// Descargar archivo de instrucciones de la IA
export function downloadAISystemPromptTxt(config?: GitHubConfig): void {
  const prompt = generateAISystemPrompt(config);
  const blob = new Blob([prompt], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'urbannoise-ai-system-instructions.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Guardar y commitear tanto el archivo de personalizaciones como el archivo completo products.json (IA) en GitHub
export async function saveCatalogToGitHub(
  customizations: Record<string, ProductCustomization>,
  allProductsOrConfig?: Product[] | GitHubConfig,
  config?: GitHubConfig
): Promise<{ success: boolean; commitSha?: string; error?: string; filesSaved?: string[] }> {
  let allProducts: Product[] | undefined;
  let cfg: GitHubConfig;

  if (Array.isArray(allProductsOrConfig)) {
    allProducts = allProductsOrConfig;
    cfg = config || getGitHubConfig();
  } else if (allProductsOrConfig && 'owner' in allProductsOrConfig) {
    cfg = allProductsOrConfig as GitHubConfig;
  } else {
    cfg = config || getGitHubConfig();
  }

  if (!isGitHubConfigured(cfg)) {
    return {
      success: false,
      error: 'GitHub no está configurado. Ve a la pestaña "GitHub & Cloudflare" para ingresar tu token de acceso.',
    };
  }

  try {
    const filesSaved: string[] = [];
    let lastCommitSha = '';

    // 1. Guardar catalog/customizations.json
    const custPath = 'catalog/customizations.json';
    const custJsonString = JSON.stringify(customizations, null, 2);
    const custBase64 = btoa(unescape(encodeURIComponent(custJsonString)));
    const custSha = await getFileSha(custPath, cfg);

    const count = Object.keys(customizations).length;
    const custCommitMsg = `Actualizar personalizaciones URBANNOISE (${count} prendas) [URBANNOISE Studio]`;

    const putCustRes = await fetch(
      `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${custPath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${cfg.token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: custCommitMsg,
          content: custBase64,
          branch: cfg.branch,
          ...(custSha ? { sha: custSha } : {}),
        }),
      }
    );

    if (putCustRes.ok) {
      const d = await putCustRes.json();
      lastCommitSha = d.commit?.sha || '';
      filesSaved.push('customizations.json');
    }

    // 2. Guardar catalog/products.json con datos completos para la IA de Cloudflare
    const productsToExport = allProducts && allProducts.length > 0 ? allProducts : PRODUCTS_DATA;
    const aiCatalogPath = 'catalog/products.json';
    const aiData = generateAICatalog(productsToExport, cfg);
    const aiJsonString = JSON.stringify(aiData, null, 2);
    const aiBase64 = btoa(unescape(encodeURIComponent(aiJsonString)));
    const aiSha = await getFileSha(aiCatalogPath, cfg);

    const aiCommitMsg = `Actualizar catálogo unificado para IA (${aiData.total_products} productos) [Cloudflare AI Ready]`;

    const putAiRes = await fetch(
      `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${aiCatalogPath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${cfg.token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: aiCommitMsg,
          content: aiBase64,
          branch: cfg.branch,
          ...(aiSha ? { sha: aiSha } : {}),
        }),
      }
    );

    if (putAiRes.ok) {
      const d = await putAiRes.json();
      lastCommitSha = d.commit?.sha || lastCommitSha;
      filesSaved.push('products.json');
    }

    // 3. Guardar catalog/ai-instructions.txt (Directivas y Guardrails de la IA)
    const promptPath = 'catalog/ai-instructions.txt';
    const promptContent = generateAISystemPrompt(cfg);
    const promptBase64 = btoa(unescape(encodeURIComponent(promptContent)));
    const promptSha = await getFileSha(promptPath, cfg);
    const putPromptRes = await fetch(
      `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${promptPath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${cfg.token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Actualizar directivas y guardrails del asistente de IA [URBANNOISE Studio]',
          content: promptBase64,
          branch: cfg.branch,
          ...(promptSha ? { sha: promptSha } : {}),
        }),
      }
    );

    if (putPromptRes.ok) {
      filesSaved.push('ai-instructions.txt');
    }

    return {
      success: filesSaved.length > 0,
      commitSha: lastCommitSha,
      filesSaved,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Error al commitear catálogo: ${err.message || err}`,
    };
  }
}

// Cargar catálogo inicial de personalizaciones desde GitHub o archivo estático público
export async function fetchCatalogFromGitHub(config?: GitHubConfig): Promise<Record<string, ProductCustomization>> {
  const cfg = config || getGitHubConfig();

  // 1. Intentar cargar el archivo estático empaquetado en el despliegue
  try {
    const localRes = await fetch(`/catalog/customizations.json?t=${Date.now()}`);
    if (localRes.ok) {
      const data = await localRes.json();
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        return data;
      }
    }
  } catch {}

  // 2. Consultar vía jsDelivr CDN público (ultrarrápido, libre de caché y disponible sin token)
  try {
    const cdnRes = await fetch(
      `https://cdn.jsdelivr.net/gh/${cfg.owner || 'tusoporteapp'}/${cfg.repo || 'urbannoise'}@${cfg.branch || 'master'}/catalog/customizations.json?t=${Date.now()}`
    );
    if (cdnRes.ok) {
      const data = await cdnRes.json();
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        return data;
      }
    }
  } catch {}

  // 3. Si hay configuración de GitHub, consultar la versión más reciente en GitHub Raw
  if (isGitHubConfigured(cfg)) {
    try {
      const rawRes = await fetch(
        `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}/catalog/customizations.json?t=${Date.now()}`,
        cfg.token ? {
          headers: {
            Authorization: `Bearer ${cfg.token}`,
          },
        } : undefined
      );
      if (rawRes.ok) {
        const data = await rawRes.json();
        if (data && typeof data === 'object') {
          return data;
        }
      }
    } catch {}
  }

  return {};
}
