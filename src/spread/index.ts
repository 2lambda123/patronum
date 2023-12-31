import { createEvent, Event, EventCallable, sample, Unit, UnitTargetable } from 'effector';

const hasPropBase = {}.hasOwnProperty;
const hasOwnProp = <O extends { [k: string]: unknown }>(object: O, key: string) =>
  hasPropBase.call(object, key);

type NoInfer<T> = [T][T extends any ? 0 : never];
type EventAsReturnType<Payload> = any extends Payload ? Event<Payload> : never;

export function spread<Payload>(config: {
  targets: {
    [Key in keyof Payload]?: UnitTargetable<Payload[Key]>;
  };
}): EventCallable<Partial<Payload>>;

export function spread<
  Source,
  Payload extends Source extends Unit<infer S> ? S : never,
>(config: {
  source: Source;
  targets: {
    [Key in keyof Payload]?:
      | EventCallable<Partial<Payload[Key]>>
      | UnitTargetable<NoInfer<Payload[Key]>>;
  };
}): Source;

/**
 * @example
 * spread({ source: dataObject, targets: { first: targetA, second: targetB } })
 * sample({
 *   target: spread({targets: { first: targetA, second: targetB } })
 * })
 */
export function spread<P>({
  targets,
  source = createEvent<P>(),
}: {
  targets: {
    [Key in keyof P]?: Unit<P[Key]>;
  };
  source?: Unit<P>;
}): EventCallable<P> {
  for (const targetKey in targets) {
    if (hasOwnProp(targets, targetKey)) {
      const currentTarget = targets[targetKey];

      const hasTargetKey = sample({
        source,
        batch: false,
        filter: (object): object is any =>
          typeof object === 'object' && object !== null && targetKey in object,
      });

      sample({
        batch: false,
        clock: hasTargetKey,
        fn: (object: P) => object[targetKey],
        target: currentTarget as UnitTargetable<any>,
      });
    }
  }

  return source as any;
}
