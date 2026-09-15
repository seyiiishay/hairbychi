import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllPages } from "../../lib/pagination";
import type { Category } from "../../api/types";
import { useCart } from "../../context/CartContext";
import { money } from "../../lib/timezone";
import { Card, ErrorBanner, PrimaryButton, SecondaryButton, Spinner } from "../../components/Shared";

export default function Browse() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { items, addService, removeService, totalPrice, totalDurationMinutes } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllPages<Category>("/categories")
      .then(setCategories)
      .catch(() => setError("Couldn't load services. Please refresh the page."));
  }, []);

  const isSelected = (id: string) => items.some((i) => i.id === id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Book an appointment</h1>
        <p className="mt-1 text-stone-500">Pick one or more services to build your booking.</p>
      </div>

      <ErrorBanner message={error} />
      {!categories && !error && <Spinner />}

      {categories?.map((category) => (
        <div key={category.id}>
          <h2 className="mb-3 text-lg font-medium text-stone-800">{category.name}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {category.services.map((service) => (
              <Card key={service.id} className="flex flex-col justify-between gap-3">
                <div>
                  {service.photo_url && (
                    <img
                      src={service.photo_url}
                      alt={service.name}
                      className="mb-3 h-32 w-full rounded-lg object-cover"
                    />
                  )}
                  <h3 className="font-medium text-stone-900">{service.name}</h3>
                  {service.description && <p className="mt-1 text-sm text-stone-500">{service.description}</p>}
                  <p className="mt-2 text-sm text-stone-600">
                    {money(service.price)} · {service.duration_minutes} min
                  </p>
                </div>
                {isSelected(service.id) ? (
                  <SecondaryButton onClick={() => removeService(service.id)}>Remove</SecondaryButton>
                ) : (
                  <PrimaryButton onClick={() => addService(service)}>Add to booking</PrimaryButton>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}

      {items.length > 0 && (
        <div className="sticky bottom-4 rounded-xl border border-brand-200 bg-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-stone-900">
                {items.length} service{items.length > 1 ? "s" : ""} selected
              </p>
              <p className="text-sm text-stone-500">
                {money(totalPrice)} · {totalDurationMinutes} min
              </p>
            </div>
            <PrimaryButton onClick={() => navigate("/book/cart")}>Review cart</PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
