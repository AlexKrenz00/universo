# Un universo de flores para vos

Una única escena interactiva construida con React, Vite, TypeScript, Three.js, React Three Fiber, Drei y Postprocessing. Sin servicios externos en tiempo de ejecución.

## Ejecutar

```sh
npm install
npm run dev
```

Producción: `npm run build`. Vista de producción: `npm run preview`. Revisión estática: `npm run lint`.

Arrastrar gira la cámara libremente; botón derecho o dos dedos desplazan la vista; scroll o pellizco ajusta el zoom. Los botones inferiores pausan el movimiento y restablecen la vista. Se respeta `prefers-reduced-motion` y se detiene el render cuando la pestaña está oculta.

## Escena

- Orbe con shader de oro, iluminación direccional, borde luminoso y grabados botánicos generados localmente y proyectados sobre sus UV.
- 48.000 partículas en escritorio y 24.000 en móvil, en una sola llamada de dibujo. Tamaño, luminosidad y transparencia varían con la profundidad.
- Ramos variados de rosas, girasoles, tulipanes, margaritas y lirios, con marcos y oclusión real delante y detrás del orbe.
- DPR limitado a 1,5, texturas WebP compartidas, animación sin actualizaciones de estado por fotograma y bloom moderado.
- Encuadre independiente para móvil y cámara libre para explorar el universo desde cualquier ángulo.

El rendimiento depende de la GPU y del navegador. La escena requiere WebGL; se muestra un mensaje alternativo si no está disponible. Three.js produce un bundle relativamente grande; Vite puede mostrar una advertencia de tamaño aunque la compilación termine correctamente.

## Arte local

`public/images/*.webp`: imágenes creadas con la herramienta integrada de generación de imágenes de OpenAI y optimizadas a WebP. No requieren enlaces externos.

Prompts usados:

1. “Create a single square 1024px premium botanical still-life photograph asset for a romantic 3D website: an abundant hand-tied bouquet of 7 fresh golden yellow sunflowers, small yellow roses, delicate white baby's breath and realistic dark olive green leaves, long stems tied with a flowing champagne silk ribbon. Entire bouquet visible, centered, fills 85 percent of square, dramatic warm studio rim light, highly detailed natural petals and intricate brown seed centers. Pure pitch black background #000000, no floor, no shadows outside bouquet, no text, no frame, no watermark. Photorealistic luxurious florist editorial, front view.”
2. “Square botanical studio photograph asset, complete elegant hand-tied bouquet of fresh pale golden yellow roses, 12 lush full roses with intricate curled petals, dark olive green leaves and fine white baby's breath, long green stems with a beautiful flowing pale gold satin bow. Full bouquet centered in frame fills 85 percent, realistic luxurious florist photograph, isolated on pure pitch black #000000, warm natural rim lighting, no text, no frame, no watermark. Entire bouquet and bow visible. This is a second flower card asset for a romantic universe website, should look photorealistic with crisp details.”

3. Tulipanes amarillos y naranjas con hojas largas, fotografía de estudio sobre fondo negro, ramo completo y lazo dorado.
4. Margaritas blancas de centros amarillos y eucalipto, fotografía de estudio sobre fondo negro, ramo completo y lazo dorado.
5. Lirios color champán con estambres y capullos, fotografía de estudio sobre fondo negro, ramo completo y lazo dorado.
