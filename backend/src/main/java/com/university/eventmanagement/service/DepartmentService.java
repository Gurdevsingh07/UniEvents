package com.university.eventmanagement.service;

import com.university.eventmanagement.exception.DuplicateResourceException;
import com.university.eventmanagement.exception.ResourceNotFoundException;
import com.university.eventmanagement.model.Department;
import com.university.eventmanagement.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    public Department getDepartmentById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
    }

    public Department createDepartment(Department department) {
        if (departmentRepository.findByCode(department.getCode()).isPresent()) {
            throw new DuplicateResourceException("Department code already exists");
        }
        if (departmentRepository.findByName(department.getName()).isPresent()) {
            throw new DuplicateResourceException("Department name already exists");
        }
        return departmentRepository.save(department);
    }

    public void deleteDepartment(Long id) {
        Department department = getDepartmentById(id);
        departmentRepository.delete(department);
    }
}
