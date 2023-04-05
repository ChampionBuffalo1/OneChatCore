class DatabaseError extends Error {}
class RecordNotFound extends DatabaseError {}

export { DatabaseError, RecordNotFound };
