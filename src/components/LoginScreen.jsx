export default function LoginScreen({ onLogin, error }) {
  return (
    <div className="panel login">
      <h1 className="title">Colortify</h1>
      <p className="subtitle">
        Sort your Spotify liked songs by the dominant color of their album
        covers — then turn any color into a playlist.
      </p>
      <button className="btn btn-primary" onClick={onLogin}>
        Log in with Spotify
      </button>
      {error && <p className="error">{error}</p>}
      <p className="note">
        Runs entirely in your browser. This is a development-mode Spotify app,
        so only whitelisted accounts can log in.
      </p>
    </div>
  );
}
