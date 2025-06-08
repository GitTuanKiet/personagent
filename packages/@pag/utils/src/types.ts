export type Primitives = string | number | boolean | bigint | symbol | null | undefined;

export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];

export type JsonObject = { [key: string]: JsonValue };
