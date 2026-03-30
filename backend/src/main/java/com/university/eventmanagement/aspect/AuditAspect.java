package com.university.eventmanagement.aspect;

import com.university.eventmanagement.service.AuditService;
import com.university.eventmanagement.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.expression.EvaluationContext;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class AuditAspect {

    private final AuditService auditService;
    private final AuthService authService;
    private final ExpressionParser parser = new SpelExpressionParser();

    @Around("@annotation(logAudit)")
    public Object logAuditAction(ProceedingJoinPoint joinPoint, LogAudit logAudit) throws Throwable {
        Object result = null;
        Throwable exception = null;

        try {
            result = joinPoint.proceed();
            return result;
        } catch (Throwable t) {
            exception = t;
            throw t;
        } finally {
            try {
                Long currentUserId = null;
                try {
                    currentUserId = authService.getCurrentUser().getId();
                } catch (Exception e) {
                    log.debug("No authenticated user found for audit logging");
                }

                Long entityId = extractEntityId(joinPoint, result, logAudit.entityIdExpression());

                String metadata = exception != null
                        ? "{\"status\":\"FAILURE\", \"error\":\"" + exception.getMessage() + "\"}"
                        : "{\"status\":\"SUCCESS\"}";

                auditService.logAction(
                        currentUserId,
                        logAudit.action(),
                        logAudit.entityType(),
                        entityId,
                        metadata);
            } catch (Exception e) {
                log.error("Failed to execute audit aspect logic", e);
            }
        }
    }

    private Long extractEntityId(ProceedingJoinPoint joinPoint, Object result, String expression) {
        if (expression == null || expression.trim().isEmpty()) {
            return null;
        }

        try {
            EvaluationContext context = new StandardEvaluationContext();

            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            String[] paramNames = signature.getParameterNames();
            Object[] args = joinPoint.getArgs();

            if (paramNames != null && args != null) {
                for (int i = 0; i < paramNames.length; i++) {
                    context.setVariable(paramNames[i], args[i]);
                }
            }
            context.setVariable("result", result);

            Object value = parser.parseExpression(expression).getValue(context);
            if (value instanceof Long) {
                return (Long) value;
            } else if (value instanceof Number) {
                return ((Number) value).longValue();
            } else if (value != null) {
                try {
                    return Long.parseLong(value.toString());
                } catch (NumberFormatException e) {
                    log.debug("Value '{}' is not a valid Long for entityId", value);
                }
            }
        } catch (Exception e) {
            log.trace("Could not extract entityId using SpEL expression '{}': {}", expression, e.getMessage());
        }
        return null;
    }
}
