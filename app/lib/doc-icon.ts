/**
 * Font Awesome icon for a repository entry without a thumbnail — by file
 * extension, the way the lists' placeholder tiles need it. Pure: safe in
 * client components.
 */
export function docIcon(kind: string, filename: string): string {
  if (kind === "url") return "fa-link";
  const ext = filename.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  switch (ext) {
    case "pdf":
      return "fa-file-pdf";
    case "doc": case "docx": case "odt": case "rtf": case "pages":
      return "fa-file-word";
    case "xls": case "xlsx": case "csv": case "ods": case "numbers":
      return "fa-file-excel";
    case "ppt": case "pptx": case "odp": case "key":
      return "fa-file-powerpoint";
    case "html": case "htm": case "json": case "xml":
      return "fa-file-code";
    case "md": case "markdown": case "txt":
      return "fa-file-lines";
    case "zip": case "gz": case "tgz": case "tar": case "7z": case "rar":
      return "fa-file-zipper";
    case "png": case "jpg": case "jpeg": case "webp": case "gif": case "avif": case "svg": case "tif": case "tiff":
      return "fa-file-image";
    case "mp4": case "mov": case "webm": case "m4v":
      return "fa-file-video";
    default:
      return "fa-file";
  }
}
