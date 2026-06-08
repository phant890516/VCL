import template from './Register.template.html?raw';

export function Register() {
  const container = document.createElement('div');
  container.className = 'main-content';
  container.innerHTML = template;
  return container;
}
