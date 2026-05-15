import Link from "next/link";
import { UploadForm } from "./upload-form";
import styles from "./page.module.css";

export default function NewPhotoPage() {
  return (
    <main className={styles.page}>
      <Link className="utility-link" href="/admin">
        Back to dashboard
      </Link>
      <p className="eyebrow">Image ingestion</p>
      <h1 className="display">Upload a photograph</h1>
      <p className="serif">
        EXIF is welcomed when present, but nothing here depends on the file being
        perfectly annotated.
      </p>
      <UploadForm />
    </main>
  );
}
