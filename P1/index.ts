function sumaRecursiva(arr: number[]): number {
  
    let suma:number = 0

    for(let i = 0;i<arr.length;i++){
        if(arr.length == 0){
            break
        }
        else{
            suma = suma + arr[i]
            sumaRecursiva(arr[arr.length - arr[i]])
            
        }
    }

    return suma

}
 
// Ejemplo de uso:
const numeros = [1, 2, 3, 4, 5];
const resultadoSuma = sumaRecursiva(numeros);
console.log(`La suma recursiva es: ${resultadoSuma}`); // Debería imprimir 15

interface Usuario {
  id: number;
  name: string;
  username: string;
  email: string;
}
 
function procesarUsuarios(usuarios: Usuario[]): string {

    
}

 
// Ejemplo de uso (puedes crear un array de usuarios de prueba):
const usuariosDePrueba = [
    { id: 1, name: 'Juan', username: 'juanito', email: 'juan@example.com' },
    { id: 2, name: 'Maria', username: 'mariita', email: 'maria@example.com' },
    { id: 6, name: 'Pedro', username: 'pedrito', email: 'pedro@example.com' }
];
 
const resultadoProcesado = procesarUsuarios(usuariosDePrueba);
console.log(`Resultado procesado: ${resultadoProcesado}`); // Debería imprimir "Nombre: Juan, Username: juanito, Nombre: Maria, Username: mariita"

async function obtenerTitulosDePosts(): Promise<string[]> {
  try{
    await fetch("https://jsonplaceholder.typicode.com/posts").then(data => data)
    
  }catch(error){

  }
}
 
// Ejemplo con async/await (opcional, para practicar):
async function ejecutarObtenerTitulos() {
  try {
    const titulos = await obtenerTitulosDePosts();
    console.log(`Títulos de los posts (con async/await): ${titulos}`);
  } catch (error) {
    console.error(`Error al obtener los títulos (con async/await): ${error}`);
  }
}
 
ejecutarObtenerTitulos();



