function Reviews() {
  const brands = ["Apple", "HyperX", "Logitech"];

  return (
    <div className="bg-white sm:py-10">
      <div className="mx-auto text-center">
        <h2 className="text-center text-lg font-semibold leading-8 text-gray-900">
          Empresas que confían en nosotros
        </h2>
        <div className="mx-auto mt-10 grid max-w-lg grid-cols-3 items-center gap-x-8 gap-y-10 lg:mx-0 lg:max-w-none">
          {brands.map((brand) => (
            <div
              key={brand}
              className="col-span-1 flex items-center justify-center h-12 px-6 rounded-lg bg-gray-100"
            >
              <span className="text-gray-700 font-semibold text-sm tracking-wide">
                {brand}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Reviews;
