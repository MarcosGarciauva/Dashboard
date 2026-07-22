export function icon(name) {
  const paths = {
    edit: `<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>`,
    copy: `<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>`,
    trash: `<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>`,
    external: `<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>`
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
}

export function quickIcon(name) {
  const icons = {
    drive: `<svg viewBox="0 0 24 24"><path fill="#34a853" d="M8.2 3h7.6l6.2 10.8h-7.6z"/><path fill="#fbbc04" d="M2 13.8 8.2 3l3.8 6.6-6.2 10.8z"/><path fill="#4285f4" d="M5.8 20.4 9.6 13.8H22l-3.8 6.6z"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24"><rect fill="#4285f4" x="3" y="4" width="18" height="17" rx="2"/><path fill="#fff" d="M6 9h12v9H6z"/><path fill="#ea4335" d="M7 2h2v4H7zm8 0h2v4h-2z"/><path fill="#188038" d="M8 12h3v3H8z"/></svg>`,
    sheets: `<svg viewBox="0 0 24 24"><path fill="#0f9d58" d="M6 2h8l4 4v16H6z"/><path fill="#a7e2c4" d="M14 2v4h4"/><path fill="#fff" d="M8 10h8v1.4H8zm0 3h8v1.4H8zm0 3h8v1.4H8z"/></svg>`,
    notion: `<span>N</span>`,
    chatgpt: `<span>◎</span>`,
    youtube: `<svg viewBox="0 0 24 24"><path fill="#ff0000" d="M22 12s0-3.5-.5-5a3 3 0 0 0-2.1-2.1C17.8 4.5 12 4.5 12 4.5s-5.8 0-7.4.4A3 3 0 0 0 2.5 7C2 8.5 2 12 2 12s0 3.5.5 5a3 3 0 0 0 2.1 2.1c1.6.4 7.4.4 7.4.4s5.8 0 7.4-.4a3 3 0 0 0 2.1-2.1c.5-1.5.5-5 .5-5Z"/><path fill="#fff" d="m10 15.5 5.2-3.5L10 8.5z"/></svg>`,
    anki: `<span>A</span>`,
    school: `<span>UM</span>`,
    platform: `<span>E42</span>`,
    gmail: `<span>M</span>`,
    keep: `<span>K</span>`
  };
  return icons[name] || `<span>${name[0].toUpperCase()}</span>`;
}
