import PetScene from "./PetScene";

export default function PetCardPreview() {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <PetScene
        characterType="pip"
        scale={0.4}
        follow={true}
        showBubble={false}
        enableIdle={true}
      />
    </div>
  );
}
