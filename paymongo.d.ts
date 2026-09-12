declare module "paymongo-node" {
  function Paymongo(secretKey: string): Record<string, unknown>;
  export default Paymongo;
}
