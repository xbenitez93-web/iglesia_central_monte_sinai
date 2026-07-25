import 'package:flutter/material.dart';

void main() => runApp(const MiAppIglesia());

class MiAppIglesia extends StatelessWidget {
  const MiAppIglesia({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Gestión Iglesia',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: const PantallaPrincipal(),
    );
  }
}

class PantallaPrincipal extends StatefulWidget {
  const PantallaPrincipal({super.key});

  @override
  State<PantallaPrincipal> createState() => _PantallaPrincipalState();
}

class _PantallaPrincipalState extends State<PantallaPrincipal> {
  int _indiceActual = 0;

  final List<Widget> _secciones = [
    const Center(child: Text('Dashboard')),
    const Center(child: Text('Directorio Inteligente')),
    const Center(child: Text('Finanzas')),
    const Center(child: Text('Eventos')),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Sistema Integral de Iglesia')),
      body: _secciones[_indiceActual],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _indiceActual,
        selectedItemColor: Colors.blue,
        unselectedItemColor: Colors.grey,
        onTap: (index) => setState(() => _indiceActual = index),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Dashboard'),
          BottomNavigationBarItem(icon: Icon(Icons.people), label: 'Directorio'),
          BottomNavigationBarItem(icon: Icon(Icons.attach_money), label: 'Finanzas'),
          BottomNavigationBarItem(icon: Icon(Icons.event), label: 'Eventos'),
        ],
      ),
    );
  }
}