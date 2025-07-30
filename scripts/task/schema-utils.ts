import {z} from "zod";
import {EnumLike, ZodRawShape, ZodTypeAny} from "zod/lib/types";


export function number() {
    return z.number();
}

export function bigint() {
    return z.coerce.bigint();
}

export function string() {
    return z.string();
}

export function array<T extends ZodTypeAny>(schema: T) {
    return z.array(schema).default([]);
}

export function object<T extends ZodRawShape>(shape: T) {
    return z.object(shape);
}

export function objectOrString<T extends ZodRawShape>(shape: T) {
    return object(shape).or(string());
}

export function enumeration<T extends EnumLike>(e: T) {
    return z.nativeEnum(e);
}
