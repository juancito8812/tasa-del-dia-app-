---
name: error-handling-patterns
description: Master error handling patterns across languages including exceptions, Result types, error propagation, and graceful degradation to build resilient applications. Use when implementing error handling, designing APIs, or improving application reliability.
---

# Error Handling Patterns

Build resilient applications with robust error handling strategies that gracefully handle failures and provide excellent debugging experiences.

## When to Use This Skill

- Implementing error handling in new features
- Designing error-resilient APIs
- Debugging production issues
- Improving application reliability
- Creating better error messages
- Implementing retry and circuit breaker patterns
- Handling async/concurrent errors
- Building fault-tolerant distributed systems

## Core Concepts

### Error Handling Philosophies

**Exceptions vs Result Types:**
- **Exceptions**: Traditional try-catch, disrupts control flow
- **Result Types**: Explicit success/failure, functional approach
- **Error Codes**: C-style, requires discipline
- **Option/Maybe Types**: For nullable values

### Error Categories

**Recoverable:** Network timeouts, missing files, invalid input, API rate limits
**Unrecoverable:** Out of memory, stack overflow, programming bugs

## Best Practices

1. **Fail Fast**: Validate input early, fail quickly
2. **Preserve Context**: Include stack traces, metadata, timestamps
3. **Meaningful Messages**: Explain what happened and how to fix it
4. **Log Appropriately**: Error = log, expected failure = don't spam logs
5. **Handle at Right Level**: Catch where you can meaningfully handle
6. **Don't Swallow Errors**: Log or re-throw, don't silently ignore
7. **Type-Safe Errors**: Use typed errors when possible

```python
# Good error handling example
def process_order(order_id: str) -> Order:
    try:
        if not order_id:
            raise ValidationError("Order ID is required")
        order = db.get_order(order_id)
        if not order:
            raise NotFoundError("Order", order_id)
        try:
            payment_result = payment_service.charge(order.total)
        except PaymentServiceError as e:
            logger.error(f"Payment failed for order {order_id}: {e}")
            raise ExternalServiceError(
                f"Payment processing failed",
                service="payment_service",
                details={"order_id": order_id, "amount": order.total}
            ) from e
        order.status = "completed"
        order.payment_id = payment_result.id
        db.save(order)
        return order
    except ApplicationError:
        raise
    except Exception as e:
        logger.exception(f"Unexpected error processing order {order_id}")
        raise ApplicationError("Order processing failed", code="INTERNAL_ERROR") from e
```

## Common Pitfalls

- **Catching Too Broadly**: `except Exception` hides bugs
- **Empty Catch Blocks**: Silently swallowing errors
- **Logging and Re-throwing**: Creates duplicate log entries
- **Poor Error Messages**: "Error occurred" is not helpful
- **Ignoring Async Errors**: Unhandled promise rejections
