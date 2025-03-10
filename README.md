# Sistema de Gestión de Inventario

Sistema web completo para la gestión de inventario, desarrollado con React, TypeScript, Tailwind CSS y Supabase.

## Características

- 🔐 **Autenticación Completa**
  - Inicio de sesión
  - Registro de usuarios
  - Recuperación de contraseña
  - Roles (Administrador/Empleado)

- 📦 **Gestión de Productos**
  - Crear, editar, ver y eliminar productos
  - Gestión de stock
  - Asignación de categorías y ubicaciones
  - Seguimiento de precios

- 🏷️ **Categorías**
  - Organización jerárquica
  - Categorías y subcategorías
  - Importación/exportación CSV

- 📍 **Ubicaciones**
  - Gestión de almacenes/ubicaciones
  - Horarios de operación
  - Importación/exportación CSV

- 📊 **Movimientos de Inventario**
  - Registro de entradas y salidas
  - Historial detallado
  - Trazabilidad completa

- 📈 **Reportes**
  - Movimientos de inventario
  - Desempeño de empleados
  - Exportación a PDF
  - Gráficos interactivos

- 👥 **Gestión de Usuarios**
  - Control de acceso basado en roles
  - Perfiles de usuario
  - Seguimiento de actividad

- 🌓 **Tema Oscuro/Claro**
  - Cambio de tema

## Tecnologías Utilizadas

- **Frontend**
  - React 18
  - TypeScript
  - Tailwind CSS
  - Zustand (Gestión de estado)
  - React Router
  - Chart.js
  - Lucide Icons

- **Backend**
  - Supabase
  - PostgreSQL
  - Row Level Security (RLS)

## Requisitos Previos

- Node.js 18 o superior
- NPM o Yarn

## Estructura del Proyecto

```
src/
├── components/     # Componentes reutilizables
├── hooks/         # Hooks personalizados
├── lib/           # Utilidades y configuraciones
├── pages/         # Páginas de la aplicación
├── store/         # Estado global (Zustand)
└── types/         # Tipos
```

## Roles y Permisos

### Administrador
- Acceso completo al sistema
- Gestión de usuarios
- Configuración del sistema
- Gestión de categorías y ubicaciones
- Reportes completos

### Empleado
- Vista de productos
- Registro de movimientos
- Reportes básicos
- Vista de perfil personal

## Características de Seguridad

- Autenticación segura con Supabase
- Row Level Security (RLS) en la base de datos
- Validación de datos en frontend y backend
- Protección de rutas basada en roles
- Tokens JWT para sesiones

## Funcionalidades Destacadas

### Gestión de Productos
- SKU único por producto
- Control de stock en tiempo real
- Historial de movimientos
- Alertas de stock bajo

### Reportes
- Filtros por fecha
- Exportación a PDF
- Gráficos interactivos
- Resúmenes automáticos

### Importación/Exportación
- Soporte para archivos CSV
- Validación de datos
- Procesamiento por lotes
- Registro de errores

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.
