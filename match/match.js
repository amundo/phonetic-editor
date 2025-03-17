/**
 * Identifies the type of a value
 * @param {*} x - The value to identify
 * @return {string} The type as a string
 */
const identifyType = (x) => {
  return Object.prototype.toString.call(x)
    .toLowerCase()
    .split(" ")[1]
    .slice(0, -1);
};

/**
 * Gets a value from an object using a path
 * @param {Array|string} path - The path to follow (array of keys or dot notation string)
 * @param {Object} object - The object to search in
 * @return {*} The value at the path or undefined if not found
 */
const getNestedValue = (path, object) => {
  if (!object) return undefined;
  
  // Convert string paths like "metadata.type" to arrays
  const keys = Array.isArray(path) ? path : path.split('.');
  
  let current = object;
  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  
  return current;
};

/**
 * Checks if an object has a value at a nested path
 * @param {Array|string} path - The path to check (array of keys or dot notation string)
 * @param {Object} object - The object to check
 * @return {boolean} True if the path exists and has a value
 */
const hasNestedValue = (path, object) => {
  return getNestedValue(path, object) !== undefined;
};

/**
 * Evaluates if a value matches a comparand based on the type of value
 * @param {*} value - The value to check
 * @param {*} comparandValue - The value to compare against
 * @return {boolean} True if the value matches the comparand
 */
const evaluateMatch = (value, comparandValue) => {
  // Regex matching
  if (value instanceof RegExp) {
    return typeof comparandValue === 'string' && value.test(comparandValue);
  }
  
  // Function for type checking (e.g., String, Number)
  if (typeof value === 'function') {
    if (value === String) return typeof comparandValue === 'string';
    if (value === Number) return typeof comparandValue === 'number';
    if (value === Boolean) return typeof comparandValue === 'boolean';
    if (value === Object) return typeof comparandValue === 'object' && comparandValue !== null;
    if (value === Array) return Array.isArray(comparandValue);
    if (value === Function) return typeof comparandValue === 'function';
    
    // For other constructors, check instanceof
    return comparandValue instanceof value;
  }
  
  // Object matching (recursive)
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return match(value, comparandValue);
  }
  
  // Default: strict equality
  return comparandValue === value;
};

/**
 * Match array helper that supports various matching strategies
 * @param {Object} queryConfig - The query configuration object
 * @param {Array} comparandArray - The array to compare against
 * @return {boolean} True if the match succeeds
 */
const matchArray = (queryConfig, comparandArray) => {
  if (!Array.isArray(comparandArray)) return false;
  
  const { strategy = 'some', value } = queryConfig;
  
  // Handle empty arrays based on strategy
  if (comparandArray.length === 0) {
    return strategy === 'every'; // Empty arrays satisfy 'every' but not 'some'
  }
  
  switch (strategy) {
    case 'some':
      // At least one array item matches the value
      return comparandArray.some(item => evaluateMatch(value, item));
      
    case 'every':
      // Every array item matches the value
      return comparandArray.every(item => evaluateMatch(value, item));
      
    case 'includes':
      // Array includes the exact value
      return comparandArray.includes(value);
      
    default:
      return false;
  }
};

/**
 * Enhanced match function that supports recursive path matching and array matching
 * @param {Object|Array} queries - Query object, array of queries, or object-based query descriptors
 * @param {Object} comparand - The object to match against
 * @return {boolean} True if all queries match the comparand
 */
const match = (queries, comparand) => {
  // Handle null or undefined comparand
  if (comparand === null || comparand === undefined) {
    return false;
  }
  
  // Handle primitive type queries (direct value comparison)
  if (typeof queries !== 'object' || queries === null) {
    return queries === comparand;
  }
  
  // Handle single object-style query
  if (!Array.isArray(queries) && 'path' in queries && 'value' in queries) {
    queries = [queries];
  }
  // Convert simple object to array of query objects
  else if (!Array.isArray(queries) && typeof queries === 'object') {
    queries = Object.keys(queries).map(key => ({
      path: key,
      value: queries[key]
    }));
  }
  
  // Handle empty query - always matches
  if (queries.length === 0) {
    return true;
  }
  
  // Process each query
  return queries.every(query => {
    // Normalize query format
    let path, value, options = {};
    
    if (Array.isArray(query)) {
      // Legacy array format [path, value, options]
      if (query.length >= 2) {
        [path, value] = query;
        if (query.length > 2) {
          options = query[2] || {};
        }
      } else {
        return false; // Invalid query format
      }
    } else if (typeof query === 'object' && query !== null) {
      // New object format { path, value, arrayMatch, etc. }
      path = query.path;
      value = query.value;
      options = { ...query };
      delete options.path;
      delete options.value;
    } else {
      return false; // Invalid query format
    }
    
    // Get the value from the comparand using the path
    const comparandValue = Array.isArray(path) || typeof path === 'string' 
      ? getNestedValue(path, comparand)
      : comparand[path];
    
    // If the path doesn't exist in the comparand
    if (comparandValue === undefined) {
      return false;
    }
    
    // Handle empty strings
    if (typeof value === 'string' && value.trim().length === 0) {
      return false;
    }
    
    // Array matching with strategy
    if (options.arrayMatch && Array.isArray(comparandValue)) {
      return matchArray({ strategy: options.arrayMatch, value }, comparandValue);
    }
    
    // Support for both legacy isQuery and new queryType options
    if (Array.isArray(value) && (options.queryType === 'conditions' || options.isQuery)) {
      return match(value, comparandValue);
    }
    
    // Use the common evaluation function
    return evaluateMatch(value, comparandValue);
  });
};

/**
 * Recursively collects all values from an object
 * @param {Object} obj - The object to collect values from
 * @param {Array} [collected=[]] - Accumulator for collected values
 * @return {Array} Array of all values
 */
const collectAllValues = (obj, collected = []) => {
  if (obj === null || obj === undefined) {
    return collected;
  }
  
  if (typeof obj !== 'object') {
    collected.push(obj);
    return collected;
  }
  
  if (Array.isArray(obj)) {
    obj.forEach(item => collectAllValues(item, collected));
    return collected;
  }
  
  // It's a non-null object
  Object.values(obj).forEach(value => {
    collectAllValues(value, collected);
  });
  
  return collected;
};

/**
 * Recursively collects all paths and values from an object
 * @param {Object} obj - The object to collect paths from
 * @param {string} [basePath=''] - The base path for recursion
 * @param {Array} [collected=[]] - Accumulator for path-value pairs
 * @return {Array} Array of [path, value] pairs
 */
const collectAllPaths = (obj, basePath = '', collected = []) => {
  if (obj === null || obj === undefined) {
    return collected;
  }
  
  if (typeof obj !== 'object' || obj instanceof RegExp) {
    collected.push([basePath, obj]);
    return collected;
  }
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const path = basePath ? `${basePath}.${index}` : `${index}`;
      collectAllPaths(item, path, collected);
    });
    // Also add the full array
    collected.push([basePath, obj]);
    return collected;
  }
  
  // It's a non-null object
  Object.entries(obj).forEach(([key, value]) => {
    const path = basePath ? `${basePath}.${key}` : key;
    collectAllPaths(value, path, collected);
  });
  
  // Also add the full object
  collected.push([basePath, obj]);
  
  return collected;
};

/**
 * Match any value in an object against a query, regardless of path
 * @param {*} query - The query to match against
 * @param {Object} comparand - The object to search in
 * @param {Object} [options={}] - Additional matching options
 * @return {boolean} True if any value matches
 */
const matchAny = (query, comparand, options = {}) => {
  // If comparand is null or undefined, no match
  if (comparand === null || comparand === undefined) {
    return false;
  }
  
  // For primitive queries, collect all values and check if any match
  if (typeof query !== 'object' || query === null || query instanceof RegExp) {
    const allValues = collectAllValues(comparand);
    
    if (query instanceof RegExp) {
      // For regex, test each string value
      return allValues.some(value => 
        typeof value === 'string' && query.test(value));
    }
    
    // For other primitives, check for exact match
    return allValues.includes(query);
  }
  
  // For object queries, collect all paths and check each one
  const allPaths = collectAllPaths(comparand);
  
  // If it's an object-based query with path/value
  if (!Array.isArray(query) && 'value' in query) {
    const { value } = query;
    
    // For each collected path and value...
    return allPaths.some(([path, pathValue]) => {
      // For arrays, use matchArray if arrayMatch is specified
      if (Array.isArray(pathValue) && query.arrayMatch) {
        return matchArray({ strategy: query.arrayMatch, value }, pathValue);
      }
      
      // Otherwise use evaluateMatch
      return evaluateMatch(value, pathValue);
    });
  }
  
  // For array of queries, check if any match at any path
  if (Array.isArray(query)) {
    return query.some(q => matchAny(q, comparand, options));
  }
  
  // For simple object queries, transform to array format and try again
  const queryArray = Object.entries(query).map(([key, value]) => ({ path: key, value }));
  return queryArray.some(q => matchAny(q, comparand, options));
};

export { match, matchAny, getNestedValue, hasNestedValue };