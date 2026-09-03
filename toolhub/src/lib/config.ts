// The admin panel is unlinked from the public site. Change VITE_ADMIN_PATH at
// build time (and ADMIN_PATH on the server, so robots.txt matches) to move it
// to an address that is not guessable.
export const ADMIN_PATH = (import.meta.env.VITE_ADMIN_PATH || "/admin").replace(/\/$/, "");

export const adminUrl = (path = "") => `${ADMIN_PATH}${path}`;
