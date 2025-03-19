export interface User {
    id: string,
    email: string,
    createdAt: Date,

    // TODO: Move to auth0 or similar.
    hash: string,
}
