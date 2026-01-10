
/* eslint-disable */
/**
 * Generated API definitions for Architect.io
 */

const functionNameSymbol = Symbol.for("convex/functionName");

/**
 * A robust recursive proxy that mimics the Convex API structure.
 * It ensures that any property access (at any depth) returns a FunctionReference object
 * that satisfies Convex's internal checks.
 */
const makeAnyApi = (path?: string): any => {
  // Define the base properties for a FunctionReference
  const ref: any = {
    _path: path,
    _symbol: "FunctionReference",
  };
  
  // Set the identifying symbol that Convex uses to get the function path
  if (path) {
    ref[functionNameSymbol] = path;
  }

  return new Proxy(ref, {
    get(target, prop) {
      // If the property is the functionNameSymbol, return the current path
      if (prop === functionNameSymbol) return path;
      
      // Handle standard FunctionReference properties
      if (prop === "_path") return path;
      if (prop === "_symbol") return "FunctionReference";

      // Allow access to common object properties to avoid issues during inspection
      if (typeof prop === 'string') {
        if (['then', 'constructor', 'toJSON', 'prototype', '$$typeof'].includes(prop)) {
          return target[prop];
        }
        // Build the next level of the API path
        const nextPath = path ? `${path}:${prop}` : prop;
        return makeAnyApi(nextPath);
      }
      
      return target[prop];
    }
  });
};

export const api: any = makeAnyApi();
