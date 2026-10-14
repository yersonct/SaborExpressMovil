export function waiterPreferenceStorageKey(name: string, userScope: string) {
  return `saborexpress-waiter:${encodeURIComponent(userScope)}:${name}`;
}
