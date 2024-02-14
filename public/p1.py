import sqlite3

# Función para buscar personas en la base de datos
def buscar_personas():
    # Conexión a la base de datos
    conexion = sqlite3.connect('mydb.db')
    cursor = conexion.cursor()
    
    # Consulta para seleccionar todas las personas
    cursor.execute('''
        SELECT * FROM registros
    ''')
    
    # Obtener todos los resultados
    resultados = cursor.fetchall()
    
    # Mostrar los resultados
    for resultado in resultados:
        print("ID:", resultado[0])
        print("Nombre:", resultado[1])
        print("Edad:", resultado[2])
        print("Fecha de Nacimiento:", resultado[3])
        print("Especialidad:", resultado[4])
        print("--------------------")
    
    # Cerrar la conexión
    conexion.close()

# Llamada a la función para buscar personas y mostrar los resultados
buscar_personas()
