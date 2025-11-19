# Contributing to Attendance System

Thank you for considering contributing to the Attendance System! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Respect differing viewpoints and experiences

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (OS, browser, Node version)

### Suggesting Features

Feature requests are welcome! Please:
- Check if the feature already exists
- Provide clear use cases
- Explain why it would be valuable
- Consider implementation complexity

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/attendance-system.git
   cd attendance-system
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

4. **Test your changes**
   - Ensure all existing features work
   - Test new functionality thoroughly
   - Check for console errors

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add amazing feature"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Create a Pull Request**
   - Provide clear description
   - Reference related issues
   - Include screenshots if UI changes

## Development Setup

### Prerequisites
- Node.js 16+
- MongoDB
- Git

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
3. Configure environment variables
4. Start development servers

## Code Style Guidelines

### JavaScript/React
- Use ES6+ features
- Use async/await over promises
- Use meaningful variable names
- Keep functions small and focused
- Add JSDoc comments for complex functions

### File Organization
```
server/
  src/
    controllers/  # Request handlers
    models/       # Database schemas
    routes/       # API routes
    middleware/   # Custom middleware
    utils/        # Helper functions
    services/     # Business logic

client/
  src/
    pages/        # Page components
    components/   # Reusable components
    store/        # State management
    utils/        # Helper functions
```

### Naming Conventions
- **Files**: camelCase.js or PascalCase.jsx
- **Components**: PascalCase
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Routes**: kebab-case

### Git Commit Messages
- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters
- Reference issues and PRs

Examples:
```
Add device fingerprinting feature
Fix authentication bug in login controller
Update README with new features
Refactor attendance marking logic
```

## Testing

### Manual Testing
- Test all user flows
- Check different user roles
- Verify error handling
- Test on different browsers
- Check mobile responsiveness

### Automated Testing (Future)
- Write unit tests for utilities
- Add integration tests for APIs
- Include E2E tests for critical flows

## Documentation

When adding features:
- Update README.md if needed
- Add JSDoc comments
- Update API documentation
- Include usage examples
- Update CHANGELOG.md

## Areas for Contribution

### High Priority
- [ ] Unit and integration tests
- [ ] API documentation improvements
- [ ] Mobile app development
- [ ] Email notification system
- [ ] SMS notification integration

### Medium Priority
- [ ] Facial recognition attendance
- [ ] Biometric authentication
- [ ] Advanced analytics features
- [ ] Multi-language support
- [ ] Dark mode improvements

### Low Priority
- [ ] UI/UX enhancements
- [ ] Performance optimizations
- [ ] Code refactoring
- [ ] Documentation improvements

## Questions?

Feel free to:
- Open an issue for discussion
- Reach out to maintainers
- Join community discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉
