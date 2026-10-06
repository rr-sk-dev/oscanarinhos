import { computed, Resource, Signal } from '@angular/core';

/**
 * A resource's value, or `fallback` while it has none (idle, loading without a previous value,
 * or error). Reading `value()` of a resource in the error state throws, even with a
 * `defaultValue`, so templates and computeds should read this instead.
 */
export function valueOr<T, F>(resource: Resource<T>, fallback: F): Signal<T | F> {
  return computed(() => (resource.hasValue() ? resource.value() : fallback));
}
