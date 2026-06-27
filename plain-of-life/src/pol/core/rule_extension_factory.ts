/**
 * An interface for a factory creating rule specific extensions on cell and plain field level.
 */
export interface RuleExtensionFactory {
  /**
   * Create a rule specific cell record. Called whenever a new cell is created. The returned cell record is attached to the
   * cell container holding the new cell.
   */
  createNewCellRecord(): Record<string, unknown>

  /**
   * Create a rule specific field record. Called when a new plain of life is created and all plain fields are initialized. Each
   * returned field record is attached to one plain fields.
   */
  createNewFieldRecord(): Record<string, unknown>
}
