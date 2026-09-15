import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { money } from "../../lib/timezone";
import { Card, InfoBanner, PrimaryButton, SecondaryButton, WizardSteps } from "../../components/Shared";

export default function Cart() {
  const { items, removeService, totalPrice, totalDurationMinutes } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <WizardSteps current={1} />
        <p className="text-stone-500">Your cart is empty.</p>
        <PrimaryButton onClick={() => navigate("/")}>Browse services</PrimaryButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WizardSteps current={1} />
      <h1 className="text-2xl font-semibold text-stone-900">Your cart</h1>

      <div className="space-y-3">
        {items.map((service) => (
          <Card key={service.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-stone-900">{service.name}</p>
              <p className="text-sm text-stone-500">
                {money(service.price)} · {service.duration_minutes} min
              </p>
            </div>
            <button className="text-sm text-red-600 hover:underline" onClick={() => removeService(service.id)}>
              Remove
            </button>
          </Card>
        ))}
      </div>

      <Card className="flex items-center justify-between bg-stone-50">
        <div>
          <p className="text-sm text-stone-500">Combined total</p>
          <p className="text-lg font-semibold text-stone-900">{money(totalPrice)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-stone-500">Combined duration</p>
          <p className="text-lg font-semibold text-stone-900">{totalDurationMinutes} min</p>
        </div>
      </Card>

      {items.length > 1 && (
        <InfoBanner>
          Multi-service bookings over the deposit threshold use the multi-service deposit amount — you'll see the
          exact amount due before you pay.
        </InfoBanner>
      )}

      <div className="flex justify-between">
        <SecondaryButton onClick={() => navigate("/")}>Add more services</SecondaryButton>
        <PrimaryButton onClick={() => navigate("/book/slots")}>Choose a time</PrimaryButton>
      </div>
    </div>
  );
}
