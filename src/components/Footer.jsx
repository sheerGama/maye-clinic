export default function Footer() {
  return (
    <footer style={styles.footer}>
      © {new Date().getFullYear()} <strong>ذوق</strong> — Maye Clinic
    </footer>
  );
}

const styles = {
  footer: {
    textAlign: "center",
    padding: 20,
    background: "#f6efe8",
    color: "#6b5a4c",
    marginTop: 40,
  },
};
