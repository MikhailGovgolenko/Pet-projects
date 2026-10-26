#import "@preview/simple-plot:1.1.0": plot, line-plot

#set page(width: 300pt, height: auto, margin: 10pt)

// Параметры линзы
#let z0 = 0.0
#let ap = 3.97
#let t = 1.5

// Уравнение профиля линзы
#let z-sol(r) = z0 + (
  5.170850194e-2 * calc.pow(r, 2)
  - 3.069862096e-4 * calc.pow(r, 4)
  + 1.932778274e-6 * calc.pow(r, 6)
  + 2.689897537e-8 * calc.pow(r, 8)
  - 1.507039271e-9 * calc.pow(r, 10)
  + 2.831055327e-11 * calc.pow(r, 12)
  + 2.560362512e-13 * calc.pow(r, 14)
  - 3.403878405e-14 * calc.pow(r, 16)
  + 8.472651009e-16 * calc.pow(r, 18)
)

// Производная профиля линзы
#let z-sol-prime(r) = (
  2 * 5.170850194e-2 * calc.pow(r, 1)
  - 4 * 3.069862096e-4 * calc.pow(r, 3)
  + 6 * 1.932778274e-6 * calc.pow(r, 5)
  + 8 * 2.689897537e-8 * calc.pow(r, 7)
  - 10 * 1.507039271e-9 * calc.pow(r, 9)
  + 12 * 2.831055327e-11 * calc.pow(r, 11)
  + 14 * 2.560362512e-13 * calc.pow(r, 13)
  - 16 * 3.403878405e-14 * calc.pow(r, 15)
  + 18 * 8.472651009e-16 * calc.pow(r, 17)
)

// Радиальная сетка
#let rr = range(0, 401).map(i => ap * i / 400)

// Координаты поверхностей линзы
#let points-z1-pos = rr.map(r => (z-sol(r), r))
#let points-z1-neg = rr.map(r => (z-sol(r), -r))
#let points-z2-pos = rr.map(r => (t - z-sol(r), r))
#let points-z2-neg = rr.map(r => (t - z-sol(r), -r))

// Высота падающего луча
#let r-in = 2
#let z1 = z-sol(r-in)
#let z-prime1 = z-sol-prime(r-in)

// Нормаль первой поверхности
#let n1-len = calc.sqrt(1 + calc.pow(z-prime1, 2))
#let N1-z = -1 / n1-len
#let N1-r = z-prime1 / n1-len

// Падающий луч
#let I1-z = 0.0
#let I1-r = 0.0

// Преломление на первой поверхности: воздух -> стекло
#let cos-th1 = -(I1-z * N1-z + I1-r * N1-r)
#let eta1 = 1.0 / 4
#let sin2-th1 = 1.0 - calc.pow(cos-th1, 2)
#let sin2-th2-1 = calc.pow(eta1, 2) * sin2-th1
#let cos-th2-1 = calc.sqrt(
  calc.max(0.0, 1.0 - sin2-th2-1)
)

#let I2-z = eta1 * I1-z + (
  eta1 * cos-th1 - cos-th2-1
) * N1-z

#let I2-r = eta1 * I1-r + (
  eta1 * cos-th1 - cos-th2-1
) * N1-r

// Пересечение со второй поверхностью
#let p2-z = z1
#let p2-r = r-in

#for k in range(1, 200) {
  let step = k * 0.01
  let tz = z1 + I2-z * step
  let tr = r-in + I2-r * step
  let surf2-z = t - z-sol(tr)

  if tz >= surf2-z {
    p2-z = tz
    p2-r = tr
    break
  }
}

// Нормаль второй поверхности
#let z-prime2 = z-sol-prime(p2-r)
#let n2-len = calc.sqrt(1 + calc.pow(z-prime2, 2))
#let N2-z = -1 / n2-len
#let N2-r = -z-prime2 / n2-len

// Преломление на выходе: стекло -> воздух
#let cos-th3 = -(I2-z * N2-z + I2-r * N2-r)
#let eta2 = 1.5 / 1.0
#let sin2-th3 = 1.0 - calc.pow(cos-th3, 2)
#let sin2-th4 = calc.pow(eta2, 2) * sin2-th3
#let cos-th4 = calc.sqrt(
  calc.max(0.0, 1.0 - sin2-th4)
)

#let I3-z = eta2 * I2-z + (
  eta2 * cos-th3 - cos-th4
) * N2-z

#let I3-r = eta2 * I2-r + (
  eta2 * cos-th3 - cos-th4
) * N2-r

// Точное положение фокуса на оси z
#let z-focus = p2-z - p2-r * (I3-z / I3-r)

// Продолжение выходящего луча через фокус до правого края графика
#let xmax-val = 5.25
#let ray-end-r = 0.0 + (p2-r / (p2-z - z-focus)) * (xmax-val - z-focus)

// Сегменты луча
#let ray-up-1 = ((-0.5, r-in), (z1, r-in))
#let ray-up-2 = ((z1, r-in), (p2-z, p2-r))
#let ray-up-3 = ((p2-z, p2-r), (xmax-val, ray-end-r))

// Размер наконечников стрелок (в единицах данных)
#let ah = 0.15 // длина лепестка вдоль линии
#let aw = 0.10 // полуширина лепестка


// Постройка графика
#align(center)[
  #box(inset: (bottom: 10pt, left: 10pt))[
    // Текстовые метки
    #place(dx: 5pt, dy: 123pt, text(size: 9pt)[0])
    #place(dx: 29pt, dy: 125pt, text(size: 9pt)[$w$])
    #place(dx: 58pt, dy: 123pt, text(size: 9pt)[$t$])
    #place(dx: 145pt, dy: 123pt, text(size: 9pt)[$z_f$])
    #place(dx: 52pt, dy: 63pt, text(size: 9pt)[$(r_b,z_b)$])
    #place(dx: -3pt, dy: 90pt, text(size: 9pt)[$r$])

    #plot(
      width: 6,
      height: 8,
      xmin: -0.5,
      xmax: 6,
      ymin: -5,
      ymax: ap * 1.2,
      xlabel: [$z$],
      ylabel: [$r$],
      xtick: none,
      ytick: none,
      show-origin: false,

      // Контур линзы
      line-plot(points-z1-pos, stroke: blue, mark: none),
      line-plot(points-z1-neg, stroke: blue, mark: none),
      line-plot(points-z2-pos, stroke: blue, mark: none),
      line-plot(points-z2-neg, stroke: blue, mark: none),

      // Пунктирные проекции к оси z
      line-plot(((z1, r-in), (z1, 0.0)), stroke: (paint: gray, thickness: 0.8pt, dash: (3pt, 2pt)), mark: none),
      line-plot(((p2-z, p2-r), (p2-z, 0.0)), stroke: (paint: gray, thickness: 0.8pt, dash: (3pt, 2pt)), mark: none),

      // Вертикальная размерная линия (z = -0.25)
      line-plot(((-0.25, 2), (-0.25, 0.0)), stroke: (paint: gray, thickness: 0.8pt, dash: (3pt, 2pt)), mark: none),
      line-plot(((-0.25 - aw, 2 - ah), (-0.25, 2), (-0.25 + aw, 2 - ah)), stroke: gray + 0.8pt, mark: none),
      line-plot(((-0.25 - aw, 0 + ah), (-0.25, 0), (-0.25 + aw, 0 + ah)), stroke: gray + 0.8pt, mark: none),

      // Горизонтальная размерная линия (r = -0.2)
      line-plot(((z1, -0.2), (p2-z, -0.2)), stroke: (paint: gray, thickness: 0.8pt, dash: (3pt, 2pt)), mark: none),
      line-plot(((z1 + ah, -0.2 - aw), (z1, -0.2), (z1 + ah, -0.2 + aw)), stroke: gray + 0.8pt, mark: none),
      line-plot(((p2-z - ah, -0.2 - aw), (p2-z, -0.2), (p2-z - ah, -0.2 + aw)), stroke: gray + 0.8pt, mark: none),

      // Лучи
      line-plot(ray-up-1, stroke: red + 1.2pt, mark: none),
      line-plot(ray-up-2, stroke: red + 1.2pt, mark: none),
      line-plot(ray-up-3, stroke: red + 1.2pt, mark: none),
    )
  ]
]