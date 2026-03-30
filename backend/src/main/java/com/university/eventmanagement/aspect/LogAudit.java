package com.university.eventmanagement.aspect;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to automatically log audit events for marked methods.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface LogAudit {

    /**
     * The action being performed, e.g., "CREATE_NOTICE", "ASSIGN_ROLE".
     */
    String action();

    /**
     * The type of entity being affected, e.g., "Notice", "UserRole".
     */
    String entityType();

    /**
     * The SpEL expression to extract the entity ID from method arguments or return
     * value.
     * Use #result for the return value, or #argName for a method argument.
     * E.g., "#result.data.id" if returning ApiResponse, or "#userId" if it's an
     * argument.
     */
    String entityIdExpression() default "";
}
