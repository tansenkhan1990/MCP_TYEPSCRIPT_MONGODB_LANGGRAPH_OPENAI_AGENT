export const MCP_TOOL_SETS = {
  read: [
    "find",
    "aggregate",
    "count",
    "list-databases",
    "list-collections",
    "collection-schema",
    "collection-indexes",
    "explain",
  ],
  create: ["insert-many", "create-collection", "create-index"],
  update: ["update-many", "rename-collection"],
  delete: ["delete-many", "drop-collection", "drop-index"],
};
