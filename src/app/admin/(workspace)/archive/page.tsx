import { ArchiveUploadForm } from "./archive-upload-form";
import styles from "./page.module.css";

export default function ArchivePage() {
  return (
    <main className={styles.page}>
      <p className="eyebrow">Archive Upload</p>
      <h1 className="display">Bring in a batch</h1>
      <p className="serif">Shared metadata is welcome here, never required.</p>
      <ArchiveUploadForm />
    </main>
  );
}
