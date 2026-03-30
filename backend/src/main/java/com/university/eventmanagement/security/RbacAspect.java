package com.university.eventmanagement.security;

import com.university.eventmanagement.model.User;
import com.university.eventmanagement.service.AuthService;
import com.university.eventmanagement.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
public class RbacAspect {

    private final AuthService authService;
    private final PermissionService permissionService;

    @Around("@annotation(requiresPermission)")
    public Object checkPermission(ProceedingJoinPoint joinPoint, RequiresPermission requiresPermission)
            throws Throwable {
        User user = authService.getCurrentUser();
        if (user == null) {
            throw new AccessDeniedException("Not authenticated");
        }

        // ADMIN bypassing check to ensure admins have access to all endpoints
        if ("ADMIN".equals(user.getPrimaryRoleName())) {
            return joinPoint.proceed();
        }

        boolean hasPerm = permissionService.hasPermission(user.getId(), requiresPermission.value());
        if (!hasPerm) {
            throw new AccessDeniedException("Missing permission: " + requiresPermission.value());
        }

        return joinPoint.proceed();
    }
}
