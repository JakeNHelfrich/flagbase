import type { Condition, EvaluationContext } from '@flagbase/types';

/**
 * Matches a single condition against an evaluation context
 */
export function matchCondition(
  condition: Condition,
  context: EvaluationContext
): boolean {
  // Get the attribute value from context
  const attributeValue = getAttributeValue(condition.attribute, context);

  // If the attribute is not present, the condition cannot match
  // Exception: 'neq' and 'not_in' and 'not_contains' should return true if attribute is missing
  if (attributeValue === undefined) {
    return (
      condition.operator === 'neq' ||
      condition.operator === 'not_in' ||
      condition.operator === 'not_contains'
    );
  }

  const conditionValue = condition.value;

  switch (condition.operator) {
    case 'eq':
      return attributeValue === conditionValue;

    case 'neq':
      return attributeValue !== conditionValue;

    case 'gt':
      return (
        typeof attributeValue === 'number' &&
        typeof conditionValue === 'number' &&
        attributeValue > conditionValue
      );

    case 'gte':
      return (
        typeof attributeValue === 'number' &&
        typeof conditionValue === 'number' &&
        attributeValue >= conditionValue
      );

    case 'lt':
      return (
        typeof attributeValue === 'number' &&
        typeof conditionValue === 'number' &&
        attributeValue < conditionValue
      );

    case 'lte':
      return (
        typeof attributeValue === 'number' &&
        typeof conditionValue === 'number' &&
        attributeValue <= conditionValue
      );

    case 'contains':
      return (
        typeof attributeValue === 'string' &&
        typeof conditionValue === 'string' &&
        attributeValue.includes(conditionValue)
      );

    case 'not_contains':
      return (
        typeof attributeValue === 'string' &&
        typeof conditionValue === 'string' &&
        !attributeValue.includes(conditionValue)
      );

    case 'starts_with':
      return (
        typeof attributeValue === 'string' &&
        typeof conditionValue === 'string' &&
        attributeValue.startsWith(conditionValue)
      );

    case 'ends_with':
      return (
        typeof attributeValue === 'string' &&
        typeof conditionValue === 'string' &&
        attributeValue.endsWith(conditionValue)
      );

    case 'in':
      return (
        Array.isArray(conditionValue) &&
        conditionValue.includes(attributeValue as string)
      );

    case 'not_in':
      return (
        Array.isArray(conditionValue) &&
        !conditionValue.includes(attributeValue as string)
      );

    default:
      return false;
  }
}

/**
 * Matches all conditions against an evaluation context (AND logic)
 * Returns true only if ALL conditions match
 */
export function matchAllConditions(
  conditions: Condition[],
  context: EvaluationContext
): boolean {
  if (conditions.length === 0) {
    return true;
  }

  return conditions.every((condition) => matchCondition(condition, context));
}

/**
 * Gets the value of an attribute from the evaluation context
 * Supports 'userId' as a special attribute and any attribute in the attributes map
 */
function getAttributeValue(
  attribute: string,
  context: EvaluationContext
): string | number | boolean | undefined {
  // Special handling for userId
  if (attribute === 'userId') {
    return context.userId;
  }

  // Look up in attributes map
  return context.attributes?.[attribute];
}
