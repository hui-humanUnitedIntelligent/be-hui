// WorkDetailPage.jsx — Backward-compatible wrapper around unified ContentDetailPage
// Route: /work/:id
import ContentDetailPage from "./content-detail/ContentDetailPage.jsx";

export default function WorkDetailPage(props) {
  return <ContentDetailPage contentType="work" {...props} />;
}
