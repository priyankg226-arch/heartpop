import { useState } from "react";
import { Copy, MessageCircle, Share2 } from "lucide-react";
import { I18nText, useLanguage } from "../i18n/react";
import { translate } from "../i18n/ui";

/** Absolute link for a hash-router path, e.g. `/create/hearts`. */
export function appLink(path: string) {
  return `${window.location.href.split("#")[0]}#${path}`;
}

/**
 * Copy / WhatsApp / device-share buttons for sending a game to friends.
 * `text` is the already-translated message placed before the link.
 */
export function ShareButtons({
  url,
  text,
  heading = "Share with friends",
}: {
  url: string;
  text: string;
  heading?: string;
}) {
  const { language } = useLanguage();
  const [notice, setNotice] = useState("");
  const full = `${text} ${url}`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(full);
      setNotice("Link copied. Send it to your friends!");
    } catch {
      setNotice("Copy isn’t available. Select and copy the link below.");
    }
  }
  async function nativeShare() {
    try {
      await navigator.share({ title: "HeartPop", text, url });
      setNotice("Sharing opened.");
    } catch (err) {
      if (!(err instanceof Error && err.name === "AbortError")) await copy();
    }
  }
  return (
    <div className="share-buttons" role="group" aria-label={translate(language, heading)}>
      <span className="eyebrow">
        <I18nText text={heading} />
      </span>
      <div className="share-buttons-row">
        <a
          className="button secondary small"
          href={`https://wa.me/?text=${encodeURIComponent(full)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={16} /> WhatsApp
        </a>
        <button type="button" className="button secondary small" onClick={copy}>
          <Copy size={16} /> <I18nText text={"Copy link"} />
        </button>
        {typeof navigator.share === "function" && (
          <button
            type="button"
            className="button secondary small"
            onClick={nativeShare}
          >
            <Share2 size={16} /> <I18nText text={"More options"} />
          </button>
        )}
      </div>
      <input
        className="share-buttons-url"
        readOnly
        aria-label={translate(language, "Link to share")}
        value={url}
        onFocus={(e) => e.target.select()}
      />
      <p role="status" className="field-meta">
        <I18nText text={notice} />
      </p>
    </div>
  );
}
