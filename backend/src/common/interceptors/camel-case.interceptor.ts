import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function transformKeys(obj: unknown, transformer: (key: string) => string): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => transformKeys(item, transformer));
  }

  if (obj instanceof Date) {
    return obj;
  }

  if (typeof obj === 'object') {
    const transformed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const newKey = transformer(key);
      transformed[newKey] = transformKeys(value, transformer);
    }
    return transformed;
  }

  return obj;
}

@Injectable()
export class CamelCaseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Don't transform incoming requests - mobile already sends camelCase
    // DTOs expect camelCase, so leave request.body as-is

    // Don't transform outgoing responses either - keep camelCase for mobile
    return next.handle();
  }
}

export class CamelCaseTransformer {
  static toCamelCase<T>(obj: unknown): T {
    return transformKeys(obj, snakeToCamel) as T;
  }

  static toSnakeCase<T>(obj: unknown): T {
    return transformKeys(obj, camelToSnake) as T;
  }
}
